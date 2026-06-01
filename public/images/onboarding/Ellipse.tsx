import * as React from "react";

const SvgComponent = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width={180}
    height={180}
    viewBox="0 0 180 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <circle cx={90} cy={90} r={90} fill="#E5E5EA" />
  </svg>
);

export default SvgComponent;
