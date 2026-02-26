import Link from "next/link";
import { notFound } from "next/navigation";
import { products } from "@/data/products";

type Props = {
  params: { slug: string };
};

export default function ProductPage({ params }: Props) {
  const product = products.find((p) => p.slug === params.slug);
  if (!product) return notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#cef5db" }}>
      <div className="container mx-auto px-4 py-16">
        <Link href="/" className="text-sm text-primary-700 mb-4 inline-block">
          ← Back
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start bg-white rounded-3xl p-8 shadow-lg">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4">
              {product.title}
            </h1>
            <p className="text-gray-700 mb-6">{product.description}</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-6">
              {product.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
            <div className="flex items-center gap-4">
              <Link href="/contact" className="inline-block px-6 py-3 bg-accent-600 text-white rounded-lg font-semibold">
                Contact Us
              </Link>
              <Link href="/" className="text-sm text-gray-700 underline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



