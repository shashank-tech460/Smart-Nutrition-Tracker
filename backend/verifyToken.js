const jwt = require('jsonwebtoken');

function verifyToken(req,res,next)
{

    if(req.headers.authorization!==undefined)
    {
        const parts = req.headers.authorization.split(" ");
        if (parts.length !== 2) return res.status(400).json({ message: 'Malformed authorization header' });
        const token = parts[1];

        jwt.verify(token,"nutrifyapp",(err,decoded)=>{
            if(!err)
            {
                // attach decoded payload for handlers needing it
                req.user = decoded;
                next();
            }
            else 
            {
                res.status(401).json({message:"Invalid Token"})
            }
        })

    
    }
    else 
    {
        res.status(401).json({message:"Authorization token missing"})
    }
    
}

module.exports = verifyToken;
