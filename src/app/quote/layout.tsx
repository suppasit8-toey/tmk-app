import { Kanit, Sarabun } from "next/font/google";

const kanit = Kanit({
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-thai",
    subsets: ["latin", "thai"],
    display: "swap",
});

const sarabun = Sarabun({
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-sarabun",
    subsets: ["latin", "thai"],
    display: "swap",
});

export const metadata = {
    title: "ใบเสนอราคา | TMK TEAM",
    description: "ใบเสนอราคาจาก TMK TEAM",
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`${kanit.variable} ${sarabun.variable}`}>
            {children}
        </div>
    );
}
