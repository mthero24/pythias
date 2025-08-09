import Users from "@/models/User";
import { serialize } from "@/functions/serialize";
import {UsersMain} from "@pythias/backend";
export const dynamic = 'force-dynamic';
export default async function User(){
    let users = await Users.find({})
    users = serialize(users)
    return (
        <UsersMain user={users}/>
    )
}