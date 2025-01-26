import User from '../../../models/User';


async function handler(req, res) {
    if (req.method === 'POST') {
        try{
            let user = new User({
                password:req.body.password,
                email:req.body.email.toLowerCase(),
                firstName: req.body.firstName,
                lastName: req.body.lastName
            });
            await user.save();
            res.status(201).json({ message: 'User created' });
        }catch(err){
            if(err.code == '11000'){
                return res.status(401).json({message: 'An account already exists with that email!'});
            }
            return res.status(401).json({message: err.message});
        }
    } else {
        res.status(500).json({ message: 'Route not valid' });
    }
}

export default handler;