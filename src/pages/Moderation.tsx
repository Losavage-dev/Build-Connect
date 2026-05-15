import { Navigate } from "react-router-dom";

/** Кабинет модератора перенесён в /profile (вкладки Жалобы и Верификация) */
const Moderation = () => <Navigate to="/profile?tab=reports" replace />;

export default Moderation;
