import { Link } from "@tanstack/react-router";

export function ProductSortManagement() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-12 items-center border-b border-slate-200 bg-white px-4">
        <h1 className="text-lg font-semibold text-slate-800">商品排序管理</h1>
      </header>
      <main className="p-4">
        <div className="rounded-md bg-white shadow-sm">
          <div className="flex">
            <div className="w-44 shrink-0 border-r border-slate-200 p-4">
              <div className="space-y-2 text-slate-700">
                <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词库管理</Link>
                <Link to="/" className="block py-1.5 cursor-pointer hover:text-blue-600">SPU词条管理</Link>
                <Link to="/scene" className="block py-1.5 cursor-pointer hover:text-blue-600">场景搜索配置</Link>
                <div className="py-1.5 cursor-pointer text-blue-600 font-medium">商品排序管理</div>
              </div>
            </div>
            <div className="flex-1 p-8 text-sm text-slate-500">
              商品排序管理功能开发中…
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}