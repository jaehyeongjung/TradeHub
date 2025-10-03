import Chat from "../Chat";
import AuthBox from "../login";
import PostBoard from "../PostBoard";
export const DashBoard = () => {
    return (
        <div className="flex gap-5 mt-5 min-h-130 h-[calc(100vh-200px)]">
            <div className="min-w-180 w-full  h-full border-2 rounded-2xl flex flex-col gap-3 p-3">
                <PostBoard></PostBoard>
            </div>
            <AuthBox></AuthBox>
            <div className="min-w-75 border-2 rounded-2xl flex flex-col items-center gap-3 h-[calc(100vh-200px)]">
                <Chat></Chat>
            </div>
        </div>
    );
};
