import Chat from "../Chat";
import AuthBox from "../login";
import PostBoard from "../PostBoard";
export const DashBoard = () => {
    return (
        <div className="flex gap-10 mt-5 h-full">
            <div className="min-w-180 w-full  h-full border-2 rounded-2xl flex flex-col gap-3 p-3">
                <PostBoard></PostBoard>
            </div>
            <AuthBox></AuthBox>
            <div className="min-w-75  border-2 rounded-2xl flex flex-col items-center gap-3">
                <Chat></Chat>
            </div>
        </div>
    );
};
