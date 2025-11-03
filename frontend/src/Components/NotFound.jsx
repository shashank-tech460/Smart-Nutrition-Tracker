import {Link} from "react-router-dom"
export default function NotFound(){
    return(
        <section className="form-block">

        <div className="not found">
            <h1>404 | Not Found </h1>
            <p> <Link to="/register">Register </Link>Now To use</p>
        </div>
        
        </section>
    )
}