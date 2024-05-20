// Applying authentication to specific endpoints
import { NextFunction, Request, Response } from 'express'
import jsonwebtoken, { sign , verify, JwtPayload} from 'jsonwebtoken'
import { JWT_SECRET } from '../utils/config'

// Protecting path
const authenticateJWT = async (request: Request, response: Response, next: NextFunction) => {

    let token = request.headers["authorization"] as string;

    if (!token) {
        return response.status(403).send({error: "A token is required for authentication"})
    }

    try {
        token = token.split(" ")[1];
        const decoded = verify(token, JWT_SECRET ?? "super-secret") as JwtPayload;
        request.body.username = decoded["username"];

    } catch (err) {
        return response.status(401).send({ error: "Invalid Token" })
    }

    return next()
}

export default authenticateJWT