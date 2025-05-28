import { generateAccessToken, generateRefreshToken } from "../../../functions/accessToken";
import isLoggedIn from "../../../middleware/isLoggedIn";
import User from "../../../models/User";

async function handler(req, res) {
    console.log(req.user);
    let user = await User.findOne({_id: req.user});
    if(req.method== 'POST'){
        console.log('generateNewKey')
        let apiKey = generateAccessToken(req.user);
        user.apiKey = apiKey;
        await user.save();
        res.json({apiKey})
    }
}

export default isLoggedIn(handler);