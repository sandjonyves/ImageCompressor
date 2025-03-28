import NavBar from '@/components/NavBar';
import ImageCompressor from '@/components/ImageCompressor';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-grow bg-gray-50">
        <div className="py-8">
          <ImageCompressor />
        </div>
      </main>
      <Footer />
    </div>
  );
}
