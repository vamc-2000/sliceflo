// app/(pages)/settings/referral/page.tsx
'use client'

import Head from 'next/head'
import Image from 'next/image'
import { FaFacebookF, FaTwitter, FaLinkedinIn } from 'react-icons/fa6'

export default function ReferralsPage() {
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  return (
    <>
      <Head>
        <title>Referrals | Sliceflo</title>
        <meta name="description" content="Refer friends or colleagues and earn rewards with Sliceflo!" />
      </Head>

      <main className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white px-4 sm:px-8 lg:px-16 py-10 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Share the Sliceflo Love, Get Rewarded!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm md:text-lg">
            Share with your friends and colleagues to experience smarter workflow and earn 15% discount
          </p>

          <div className="flex justify-center">
            <Image
              src="/images/Referral.svg"
              alt="Referral illustration"
              width={400}
              height={400}
              className="w-[200px] sm:w-[250px] md:w-[300px] lg:w-[400px] h-auto"
              priority
            />
          </div>

          <div className="flex justify-center items-center gap-6 mb-4">
            <a
              href="https://facebook.com/sharer/sharer.php?u=https://yourdomain.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className="p-3 rounded-full bg-[#3B5998] hover:bg-blue-700 transition-colors text-white"
            >
              <FaFacebookF className="w-5 h-5" />
            </a>

            <a
              href="https://twitter.com/intent/tweet?url=https://yourdomain.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Twitter"
              className="p-3 rounded-full bg-black hover:bg-gray-800 transition-colors text-white"
            >
              <FaTwitter className="w-5 h-5" />
            </a>

            <a
              href="https://www.linkedin.com/sharing/share-offsite/?url=https://yourdomain.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              className="p-3 rounded-full bg-[#007AB9] hover:bg-blue-600 transition-colors text-white"
            >
              <FaLinkedinIn className="w-5 h-5" />
            </a>
          </div>

          <button
            onClick={handleCopy}
            className="bg-[#001F3F] hover:bg-blue-800 text-white py-2.5 px-6 rounded-md text-sm md:text-base transition-colors"
          >
            Copy shareable link
          </button>
        </div>
      </main>
    </>
  )
}
