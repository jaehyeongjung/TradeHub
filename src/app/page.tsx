import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";

export const Home = () => {
    return (
        <div className="min-h-screen flex flex-col px-5 bg-black">
            <RealTimeSection />
            <DashBoard />
        </div>
    );
};

export default Home;
