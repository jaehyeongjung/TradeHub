export const DashBoard = () => {
    return (
        <div className="flex gap-10 mt-10 ml-5">
            <div className="w-500 bg-amber-200 h-120 border-2 rounded-2xl ">
                <span className="flex justify-center items-center">
                    여기가 커뮤니티
                </span>
            </div>
            <div className="w-150 bg-amber-400 mr-5 border-2 rounded-2xl">
                여기가 실시간 채팅{" "}
            </div>
        </div>
    );
};
