import { RealTimeSection } from "@/components/RealTimeSection";
import { DashBoard } from "@/components/DashBorad";

export const Home = () => {
    return (
        <div className="min-h-screen">
            <RealTimeSection />
            <DashBoard />
        </div>
    );
};

export default Home;
