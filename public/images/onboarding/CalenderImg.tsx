import * as React from "react"
const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={60}
    height={60}
    fill="none"
    {...props}
  >
    <path
      stroke="#3E78B2"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      d="M7.5 22.5h45m-35-15v5m25-5v5M15 32.5h5m-5 10h5m7.5-10h5m-5 10h5m7.5-10h5m-5 10h5m-29.5 10h29c2.8 0 4.2 0 5.27-.545a5 5 0 0 0 2.185-2.185c.545-1.07.545-2.47.545-5.27v-24c0-2.8 0-4.2-.545-5.27a4.999 4.999 0 0 0-2.185-2.185C48.7 12.5 47.3 12.5 44.5 12.5h-29c-2.8 0-4.2 0-5.27.545a4.999 4.999 0 0 0-2.185 2.185C7.5 16.3 7.5 17.7 7.5 20.5v24c0 2.8 0 4.2.545 5.27a5 5 0 0 0 2.185 2.185c1.07.545 2.47.545 5.27.545Z"
    />
  </svg>
)
export default SvgComponent
