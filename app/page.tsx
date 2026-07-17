import type { Metadata } from "next";
import ReviewWorkspace from "./review-workspace";

export const metadata: Metadata = {
  title: { absolute: "仟传小省力 · 达人稿件审核" },
  description: "按项目保存 Brief，持续上传达人稿件并汇总审核结果。",
};

export default function Home() {
  return <ReviewWorkspace />;
}
