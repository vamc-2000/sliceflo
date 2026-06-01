import * as React from "react";

const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={60}
    height={60}
    fill="none"
    style={{
      
      top: 29,
      left: 100,
    }}
    {...props}
  >
    <path
      fill="#34C759"
      d="M45 39.681v2.455H0V0h2.454v39.682H45ZM33.75 2.823H5.728v2.761H33.75V2.823Zm-9 5.052H9.819v2.761H24.75V7.875Zm-2.25 6.903h14.931v-2.761H22.5v2.761Zm.511 5.963H8.08v2.762H23.01V20.74Zm0 7.518v-2.761h-9v2.76h9Zm9.41 3.528v-2.762h-8.694v2.762h8.693Zm.663 3.477h8.694v-2.761h-8.694v2.761Z"
    />
  </svg>
);

export default SvgComponent;
