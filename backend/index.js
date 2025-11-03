const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const axios = require('axios');
const cron = require('node-cron');
const morgan = require('morgan');
const generateDailyReport = require('./Controllers/reportController');
const cors = require('cors');
const sendMessageToAllUsers = require('./sendMessage');
const multer = require('multer');

const userModel = require('./models/userModel')
const foodModel = require("./models/foodModel")
const trackingModel = require("./models/trackingModel")
const PhysicalModel=require("./models/PhysicalModel")
const postModel =require("./models/postModel")
const verifyToken = require("./verifyToken")
const User = require('./models/ProfileModel');
const UserinfoModel = require('./models/UserInfoModel');
const WaterModel = require('./models/waterModel');
const sendOtpEmail = require("./services/mailService.js")
const authRoutes = require('./routes/auth');

// Database connection
mongoose.connect("mongodb://localhost:27017/nutrify")
  .then(() => console.log("Database connection successful"))
  .catch((err) => console.log(err));

let timeZone = process.env.TIMEZONE || 'Asia/Kolkata';

// 🕒 Daily Report (for testing: runs every minute)
cron.schedule('0 22 * * *', async () => {
  try {
    console.log('Running daily report job...');
    await generateDailyReport();
    console.log('Daily report completed and sent!');
  } catch (err) {
    console.error('Error generating daily report:', err);
  }
}, { timezone: timeZone });

// 🍽️ Scheduled messages
const scheduleMessages = () => {
  cron.schedule('0 8 * * *', () => {
    sendMessageToAllUsers('Good morning! It’s time for breakfast.');
  }, { timezone: timeZone });

  cron.schedule('0 12 * * *', () => {
    sendMessageToAllUsers('It’s lunch time! Enjoy your meal.');
  }, { timezone: timeZone });

  cron.schedule('0 19 * * *', () => {
    sendMessageToAllUsers('Dinner is ready! Time to eat.');
  }, { timezone: timeZone });
};

scheduleMessages();

// Admin endpoint to manually trigger the daily report (useful for testing)
// Setup express app and common middleware helpers early so endpoints can use them
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();

app.use(express.json({ limit: '10mb' })); // Set the limit to 10MB
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors());
// Request logging for debugging
app.use(morgan('dev'));

app.post('/admin/send-daily-report', verifyToken, asyncHandler(async (req, res) => {
  // Optionally restrict by admin in request body or check token claims
  try {
    await generateDailyReport();
    res.status(200).json({ message: 'Daily report triggered' });
  } catch (err) {
    console.error('Error triggering daily report:', err);
    res.status(500).json({ message: 'Failed to run daily report' });
  }
}));

// Admin test email endpoint to check transporter and actual sending
const { verifyTransporter, sendReportEmail } = require('./services/mailService');

app.post('/admin/test-email', verifyToken, asyncHandler(async (req, res) => {
  const to = req.body && req.body.to ? req.body.to : req.user && req.user.email;
  if (!to) return res.status(400).json({ message: 'No recipient provided and token has no email' });

  try {
    await verifyTransporter();
  } catch (err) {
    console.error('Transporter verify failed:', err);
    return res.status(500).json({ message: 'Transporter verification failed', error: err.message || err });
  }

  try {
    const info = await sendReportEmail(to, 'This is a test email from NutriFy backend. If you receive this, mail sending works.');
    res.status(200).json({ message: 'Test email sent', info });
  } catch (err) {
    console.error('Error sending test email:', err);
    res.status(500).json({ message: 'Failed to send test email', error: err && err.message ? err.message : err });
  }
}));

// POST /admin/send-daily-report/:userId - send report for a single user
app.post('/admin/send-daily-report/:userId', verifyToken, asyncHandler(async (req, res) => {
  const requesterEmail = req.user && req.user.email;
  const { userId } = req.params;

  // admin list can be provided as comma-separated emails in ADMIN_EMAILS env var
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);

  // allow if requester is admin or requesting their own report (you may want stronger checks)
  const allowed = adminEmails.includes(requesterEmail) || false;
  if (!allowed) {
    // Allow self-request if the requester's id equals the target userId
    // Note: verifyToken currently sets req.user to decoded token which should include userid/email if login issued it
    if (req.user && (req.user.userid === userId || req.user.userId === userId || req.user.id === userId)) {
      // allowed
    } else {
      return res.status(403).json({ message: 'Not authorized to send report for this user' });
    }
  }

  try {
    const result = await generateDailyReport.sendReportForUserId(userId, { forDate: req.query.forDate });
    res.status(200).json({ message: 'Report sent', result });
  } catch (err) {
    console.error('Error sending user report:', err);
    res.status(500).json({ message: err.message || 'Failed to send user report' });
  }
}));


app.use('/register', authRoutes);

// Simple health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));


app.post('/send-messages', async (req, res) => {
  const { message } = req.body; // Get message from request body

  if (!message) {
      return res.status(400).send('Message content is required.');
  }

  try {
      await sendMessageToAllUsers(message); // Call the function to send messages
      res.status(200).send('Messages sent successfully.');
  } catch (error) {
      console.error('Error in sending messages:', error);
      res.status(500).send('Server error');
  }
});

app.delete('/posts/:id', async (req, res) => {
  const postId = req.params.id;

  try {
      const deletedPost = await postModel.findByIdAndDelete(postId);
      if (!deletedPost) {
          return res.status(404).send('Post not found');
      }
      res.status(200).send('Post deleted successfully');
  } catch (err) {
      console.error("Error deleting post:", err);
      res.status(500).send('Server error');
  }
});


app.post("/register", (req,res)=>{
    
    let user = req.body;

    bcrypt.genSalt(10,(err,salt)=>{
        if(!err)
        {
            bcrypt.hash(user.password,salt,async (err,hpass)=>{
                if(!err)
                {
                    user.password=hpass;
                    try 
                    {
                        let doc = await userModel.create(user)
                        res.status(201).send({message:"User Registered"})
                    }
                    catch(err){
                        console.log(err);
                        res.status(500).send({message:"Some Problem"})
                    }
                }
            })
        }
    })

    
})

app.post("/login",async (req,res)=>{

    let userCred = req.body;

    try 
    {
        const user=await userModel.findOne({email:userCred.email});
        if(user!==null)
        {
            bcrypt.compare(userCred.password,user.password,(err,success)=>{
                if(success==true)
                {
                    jwt.sign({email:userCred.email},"nutrifyapp",(err,token)=>{
                        if(!err)
                        {
                            res.send({message:"Login Success",token:token,userid:user._id,name:user.name});
                            console.log("hh");
                        }
                    })
                }
                else 
                {
                    res.status(403).send({message:"Incorrect password"})
                }
            })
        }
        else 
        {
            res.status(404).send({message:"User not found"})
        }


    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem"})
    }



})



app.get("/foods",verifyToken,async(req,res)=>{

    try 
    {
        let foods = await foodModel.find();
        res.send(foods);
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem while getting info"})
    }

})

app.get('/foods/random', async (req, res) => {
  const numMeals = req.query.count || 5; // Number of meals to return, default to 5
  try {
    const mealsCount = await foodModel.countDocuments();
    const randomIndex = Math.floor(Math.random() * mealsCount);
    const randomMeals = await foodModel.find().skip(randomIndex).limit(numMeals);
    res.json(randomMeals);
  } catch (error) {
    console.error('Error fetching random meals:', error);
    res.status(500).json({ message: 'Error fetching random meals' });
  }
});
app.get("/foods/:name",verifyToken,async (req,res)=>{

    try
    {
        let foods = await foodModel.find({name:{$regex:req.params.name,$options:'i'}})
        if(foods.length!==0)
        {
            res.send(foods);
        }
        else 
        {
            res.status(404).send({message:"Food Item Not Fund"})
        }
       
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in getting the food"})
    }
    

})


app.post("/track", verifyToken, asyncHandler(async (req, res) => {
    let trackData = req.body;
    // Normalize eatenDate: accept trackData.eatenDate (d/m/yyyy, d-m-yyyy), trackData.date (ISO), or default to today
    const formatDDMMYYYY = (dObj) => {
      const dd = String(dObj.getDate()).padStart(2, '0');
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dObj.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const pad = (n) => String(n).padStart(2, '0');
    const normalizeToDDMMYYYY = (input) => {
      if (!input) return null;
      const s = String(input).trim().replace(/\//g, '-');
      const parts = s.split('-').map(p => Number(p));
      if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
        // If first part > 31 it's likely YYYY-MM-DD
        if (parts[0] > 31) {
          const [y, m, d] = parts;
          return `${pad(d)}-${pad(m)}-${y}`;
        }
        const [d, m, y] = parts;
        return `${pad(d)}-${pad(m)}-${y}`;
      }
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) return formatDDMMYYYY(parsed);
      return null;
    };

    let eatenDateStr = null;
    if (trackData.eatenDate && typeof trackData.eatenDate === 'string') {
      eatenDateStr = normalizeToDDMMYYYY(trackData.eatenDate);
    } else if (trackData.date) {
      eatenDateStr = normalizeToDDMMYYYY(trackData.date);
    }
    if (!eatenDateStr) eatenDateStr = formatDDMMYYYY(new Date());

    const toCreate = Object.assign({}, trackData, { eatenDate: eatenDateStr });
    const created = await trackingModel.create(toCreate);
    console.log('Created tracking:', created);
    res.status(201).json(created);
}));


// endpoint to fetch all foods eaten by a person 

app.get('/track/:userid/:date', asyncHandler(async (req, res) => {
  const userid = req.params.userid;
  const rawDate = req.params.date;

  if (!userid) return res.status(400).json({ message: 'userid is required' });

  // Determine the expected eatenDate string stored in DB.
  // The app historically stores eatenDate as 'D/M/YYYY' (e.g. '5/10/2025').
  const normalizeToDDMMYYYY = (input) => {
    if (typeof input !== 'string') return null;
    // replace slashes with dashes
    const s = input.replace(/\//g, '-');
    const parts = s.split('-').map(p => Number(p));
    if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
      // parts might be dd-mm-yyyy or yyyy-mm-dd
      if (parts[0] > 31) {
        // likely yyyy-mm-dd
        const [y, m, d] = parts;
        return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
      }
      const [d, m, y] = parts;
      return `${String(d).padStart(2,'0')}-${String(m).padStart(2,'0')}-${y}`;
    }
    // try Date parse
    const parsed = new Date(input);
    if (isNaN(parsed.getTime())) return null;
    return `${String(parsed.getDate()).padStart(2,'0')}-${String(parsed.getMonth()+1).padStart(2,'0')}-${parsed.getFullYear()}`;
  };

  const strDate = normalizeToDDMMYYYY(rawDate);
  if (!strDate) return res.status(400).json({ message: 'Invalid date format' });

  const foods = await trackingModel.find({ userId: userid, eatenDate: strDate }).populate('userId').populate('foodId');
  return res.status(200).json(foods);
}));
    /*app.get('/posts/:userId', async (req, res) => {
      const { userId } = req.params;
    
      try {
        // Find all posts by userId
        const userPosts = await postModel.find({ userId });
    
        if (userPosts.length === 0) {
          return res.status(404).json({ message: 'No posts found for this user!' });
        }
    
        // Return the posts (including base64 images) as a response
        res.status(200).json(userPosts);  // Use userPosts instead of undefined 'posts'
      } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Error fetching posts', error });
      }
    }); */
    app.get('/user/:userId/posts', async (req, res) => {
      const { userId } = req.params; // This should be the user ID
      try {
          // Check if userId is a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(userId)) {
              return res.status(400).json({ message: 'Invalid user ID' });
          }
  
          const posts = await postModel.find({ userId: userId });
          res.status(200).json(posts);
      } catch (error) {
          console.error('Error fetching user posts:', error);
          res.status(500).json({ message: 'Error fetching user posts', error });
      }
  });

    app.get('/posts/:postId', async (req, res) => {
      const { postId } = req.params; // Extract postId from the URL
      try {
          const post = await postModel.findById(postId); // Find post by postId
          if (!post) {
              return res.status(404).json({ message: 'Post not found' });
          }
          res.status(200).json(post);
      } catch (error) {
        console.log("i am here");
          console.error('Error fetching post:', error);
          res.status(500).json({ message: 'Error fetching post', error });
      }
  });
  
    


app.post('/posts', upload.single('image'), async (req, res) => {
    const { userId,title,content } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image || !title || !content) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Create a new ProfilePhoto document and save the image with userId
      const newProfilePhoto = new postModel({
        userId, 
        title,
        content,   // Link to the user
        image,     // Store the base64 image data
      });
  
      // Save the document to the database
      const savedPhoto = await newProfilePhoto.save();
  
      if (!savedPhoto) {
        return res.status(500).json({ message: 'Failed to save profile photo' });
      }
  
      res.status(200).json({
        message: 'Profile photo uploaded successfully!',
        savedPhoto,  // Return the saved profile photo details
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  });
  
  app.post('/upload_profile_photo', upload.single('image'), async (req, res) => {
    const { userId } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Check if the user already exists in the database
      const existingUser = await User.findOne({ userId });
  
      if (existingUser) {
        // If user exists, update the profile photo
        existingUser.image = image;
  
        // Save the updated document to the database
        const updatedUser = await existingUser.save();
  
        res.status(200).json({
          message: 'Profile photo updated successfully!',
          updatedUser,  // Return the updated user details
        });
      } else {
        // If user doesn't exist, create a new document
        const newProfilePhoto = new User({
          userId,    // Link to the user
          image,     // Store the base64 image data
        });
  
        // Save the new document to the database
        const savedPhoto = await newProfilePhoto.save();
  
        res.status(200).json({
          message: 'Profile photo uploaded successfully!',
          savedPhoto,  // Return the saved profile photo details
        });
      }
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  });
// Post route to handle image upload
/*app.post('/upload_profile_photo', upload.single('image'), async (req, res) => {
    const { userId } = req.body;  // Extract userId from the request body
    const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64
  
    if (!userId || !image) {
      return res.status(400).json({ message: 'User ID and image are required!' });
    }
  
    try {
      // Create a new ProfilePhoto document and save the image with userId
      const newProfilePhoto = new User({
        userId,    // Link to the user
        image,     // Store the base64 image data
      });
  
      // Save the document to the database
      const savedPhoto = await newProfilePhoto.save();
  
      if (!savedPhoto) {
        return res.status(500).json({ message: 'Failed to save profile photo' });
      }
  
      res.status(200).json({
        message: 'Profile photo uploaded successfully!',
        savedPhoto,  // Return the saved profile photo details
      });
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      res.status(500).json({ message: 'Error uploading profile photo', error });
    }
  }); */
  
// Backend route to fetch profile photo by userId
app.get('/upload_profile_photo/:userId', async (req, res) => {
    const { userId } = req.params;
  
    try {
      // Find the user's profile photo by userId
      const profilePhoto = await User.findOne({ userId });
  
      if (!profilePhoto) {
        return res.status(404).json({ message: 'Profile photo not found!' });
      }
  
      // Return the base64 image and other data
      res.status(200).json({
        message: 'Profile photo fetched successfully!',
        image: profilePhoto.image,  // Send base64 image as a response
      });
    } catch (error) {
      console.error('Error fetching profile photo:', error);
      res.status(500).json({ message: 'Error fetching profile photo', error });
    }
  });

  app.post('/userinfo', verifyToken, async (req, res) => {
    try {
      const allowedFields = [
        'firstName','lastName','age','height','weight','bloodGroup','email','contactNumber','activityLevel','allergies','healthConditions','fitnessGoal','dietaryPreferences','foodPreferences','hobbies','bmi','dailyCalorieRequirement','userId'
      ];
      const incoming = req.body || {};

      const userId = incoming.userId;
      if (!userId) return res.status(400).json({ message: 'User ID is required' });

      // Build an update object containing only provided fields (avoid setting undefined)
      const updateData = {};
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(incoming, key) && incoming[key] !== undefined) {
        if (key === 'userId') continue; // don't store userId inside subdoc
        updateData[key] = incoming[key];
        }
      }

      const updatedUserInfo = await UserinfoModel.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { new: true, upsert: true }
      );

      res.status(200).json(updatedUserInfo);
    } catch (error) {
      console.error(error);
      if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Something went wrong' });
    }
});

// Water intake endpoints
// POST /water_intake - body: { userId, date (YYYY-MM-DD), waterConsumed }
app.post('/water_intake', verifyToken, asyncHandler(async (req, res) => {
  const { userId, date, waterConsumed } = req.body;
  if (!userId || !date) return res.status(400).json({ message: 'userId and date are required' });

  // Use upsert behavior: if a record for the user+date exists, increment, else create
  const existing = await WaterModel.findOne({ userId, date });
  if (existing) {
    existing.waterConsumed = Number(existing.waterConsumed || 0) + Number(waterConsumed || 0);
    await existing.save();
    return res.status(200).json(existing);
  }

  const created = await WaterModel.create({ userId, date, waterConsumed: Number(waterConsumed || 0) });
  res.status(201).json(created);
}));

// GET /water_intake/:userId/:date - returns { waterConsumed }
app.get('/water_intake/:userId/:date', verifyToken, asyncHandler(async (req, res) => {
  const { userId, date } = req.params;
  if (!userId || !date) return res.status(400).json({ message: 'userId and date are required' });

  const record = await WaterModel.findOne({ userId, date });
  if (!record) return res.status(200).json({ waterConsumed: 0 });
  res.status(200).json({ waterConsumed: record.waterConsumed });
}));


app.get('/userinfo/:userId', verifyToken, async (req, res) => {
  try {
      const { userId } = req.params; // Extract userId from the URL

      // Ensure userId is passed and valid
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      // Fetch user info by userId
      const userInfo = await UserinfoModel.findOne({ userId });

      if (!userInfo) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Return the fetched user data
      res.status(200).json(userInfo);
  } catch (error) {
      console.error('Error fetching user info:', error);
      res.status(500).json({ message: 'Something went wrong' });
  }
});
app.get('/posts', async (req, res) => {
  try {
    const posts = await postModel.find(); // Fetch all posts from the database
    // If there are no posts, return an empty array (frontend expects array)
    if (!posts || posts.length === 0) {
      return res.status(200).json([]);
    }

    // Shuffle and select up to 5 random posts
    const shuffledPosts = posts.sort(() => 0.5 - Math.random());
    const selectedPosts = shuffledPosts.slice(0, Math.min(5, posts.length));

    res.status(200).json(selectedPosts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Proxy route to call Edamam API server-side to avoid CORS and keep keys secret
// Expects body: { dietPreference, calories, totalMeals, healthSpec }
app.post('/generateMeal', asyncHandler(async (req, res) => {
    const { dietPreference = '', calories, totalMeals = 7, healthSpec } = req.body;

    const APP_ID = process.env.EDAMAM_APP_ID;
    const APP_KEY = process.env.EDAMAM_APP_KEY;

    if (!APP_ID || !APP_KEY) {
      console.error('Edamam APP_ID/APP_KEY missing in env');
      return res.status(500).json({ message: 'Server misconfiguration: Edamam keys missing' });
    }

    const from = 0;
    const to = Number.isFinite(Number(totalMeals)) ? Number(totalMeals) : 7;
    const caloriesParam = Number.isFinite(Number(calories)) ? Number(calories) : undefined;

    // Build query params - ensure q is never empty (Edamam returns 404 for empty q in some cases)
    const params = new URLSearchParams();
    const qParam = (typeof dietPreference === 'string' && dietPreference.trim().length > 0) ? dietPreference.trim() : 'meal';
    params.append('q', qParam);
    params.append('app_id', APP_ID);
    params.append('app_key', APP_KEY);
    params.append('from', String(from));
    params.append('to', String(to));
    if (caloriesParam !== undefined) params.append('calories', String(caloriesParam));
    if (healthSpec) params.append('health', healthSpec);

    const edamamUrl = `https://api.edamam.com/search?${params.toString()}`;

    try {
      const resp = await axios.get(edamamUrl);
      return res.status(200).json({ hits: resp.data.hits });
    } catch (err) {
      console.error('Error proxying to Edamam:', err && err.message ? err.message : err);
      if (err.response) {
        console.error('Edamam response status:', err.response.status);
        console.error('Edamam response data:', err.response.data);
        const serverMessage = err.response.data && err.response.data.message ? err.response.data.message : `Edamam returned status ${err.response.status}`;
        return res.status(502).json({ message: `Edamam error: ${serverMessage}` });
      }
      return res.status(500).json({ message: 'Failed to fetch meal plan from Edamam' });
    }
}));

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try setting a different PORT environment variable.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
// Centralized error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

// Process-level error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  // Decide whether to exit; here we log and keep running for dev, but consider exiting in production
});

process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
  // Consider logging to monitoring or exiting depending on severity
});
/*app.post("/physical_info", verifyToken, async (req, res) => {
    const phyData = req.body;

    console.log("Incoming physical data:", phyData);

    try {
        // Check if a record with the same userId already exists
        const existingData = await PhysicalModel.findOne({ userId: phyData.userId });

        if (existingData) {
            // If it exists, update the existing record
            existingData.height = phyData.height;
            existingData.weight = phyData.weight;
            existingData.bmi = phyData.bmi;
            await existingData.save();
            console.log("Physical data updated:", existingData);
            return res.status(200).send({ message: "Physical data updated successfully." });
        } else {
            // If it does not exist, create a new record
            const newData = await PhysicalModel.create(phyData);
            console.log("Physical data added:", newData);
            return res.status(201).send({ message: "Physical data added successfully." });
        }
    } catch (err) {
        console.log("Error occurred:", err);
        res.status(500).send({ message: "Some problem occurred while import.metaing the request." });
    }
}); 
/*app.post("/posts",verifyToken,async (req,res)=>{
    
    let postData = req.body;
    
    try 
    {
        let data = await postModel.create(postData);
       // console.log(data)
        res.status(201).send({message:"Post Added In database"});
    }
    catch(err)
    {
        console.log(err);
        res.status(500).send({message:"Some Problem in adding the food"})
    }
    


})
app.post("/posts",  upload.single('image'), async (req, res) => {
    const { userId, title, content } = req.body; // Extract data from request body
  const image = req.file ? req.file.buffer.toString('base64') : null; // Convert image to base64

  if (!userId || !title || !content) {
    return res.status(400).json({ message: 'User ID, title, and content are required!' });
  }

  try {
    // Create a new post and save it in the database
    const newPost = new postModel({
      userId,
      title,
      content,
      image,
    });

    const savedPost = await newPost.save(); // Save to database

    res.status(200).json({
      message: 'Post created successfully!',
      savedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      message: 'Error creating post',
      error,
    });
  }
}); 


app.get('/posts/:userId', async (req, res) => {

        try {
            const userId = req.params.userId;
    
            // Find all posts for the user
            const posts = await postModel.find({ userId }).sort({ createdAt: -1 });
    
            if (posts.length === 0) {
                return res.status(404).json({ message: 'No posts found' });
            }
    
            return res.status(200).json(posts); // Return the posts
        } catch (error) {
            console.error('Error fetching posts:', error);
            return res.status(500).json({ message: 'Server error', error });
        }
    }); */
