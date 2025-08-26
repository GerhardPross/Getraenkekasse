import Image from 'next/image';
import Link from 'next/link';
export default function Header() {
  return (
    <div className='shadow sticky-top mb-1 bg-primary d-flex justify-content-between px-3' style={{ fontSize: "2vw" }}>
      <div className='d-flex justify-content-center align-items-center ml-5 '>
        {/* Hier müssen Sie Ihren Impressum hinterlegen */}
        <Link href="" className='text-white text-decoration-none'>Impressum</Link>
      </div>
      <div className='d-flex justify-content-center align-items-center'>
        <Image 
          src="/bilder/logoersatz.svg" 
          alt="Logo" 
          width={500} 
          height={100} 
          className='img-fluid'
          style={{ 
            maxWidth: 'min(200px, 40vw)',
            height: 'auto',
            padding: '10px'
          }}
        />
      </div>
      <div className='d-flex justify-content-center align-items-center mr-5'>
        {/* Hier müssen Sie Ihren Datenschutz hinterlegen */}
        <Link href="" className='text-white text-decoration-none'>Datenschutz</Link>
      </div>
    </div>
  );
}


