import * as React from "react"
const SvgComponent = (props:React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={42}
    height={43}
    fill="none"
    {...props}
  >
    <rect width={40.8} height={40.8} x={0.6} y={1.1} fill="#F2F2F7" rx={20.4} />
    <rect
      width={40.8}
      height={40.8}
      x={0.6}
      y={1.1}
      stroke="#8E8E93"
      strokeDasharray="5 5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={0.8}
      rx={20.4}
    />
    <path
      stroke="#8E8E93"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="m19.718 16.414-6.353 8.838c-.13.189-.2.403-.2.621-.002.219.066.433.196.623s.317.347.542.458c.226.11.483.17.745.173h12.705c.261-.003.518-.062.744-.173.226-.11.413-.269.542-.458.13-.19.198-.404.197-.623 0-.218-.07-.432-.2-.621l-6.353-8.838a1.414 1.414 0 0 0-.547-.44 1.74 1.74 0 0 0-.736-.162c-.258 0-.511.056-.736.161a1.414 1.414 0 0 0-.546.441Z"
    />
  </svg>
)
export default SvgComponent
