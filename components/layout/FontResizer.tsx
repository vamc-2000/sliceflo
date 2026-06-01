// "use client";

// import { useEffect } from "react";
// import { useProfileStore } from "@/stores/profile-store";

// export function FontResizer() {
//   const fontSize = useProfileStore((state) => state.user?.displaySettings?.fontSize);
  
//   useEffect(() => {
//     if (!fontSize) {
//       document.documentElement.style.fontSize = "";
//       return;
//     }

//     const sizes: Record<string, string> = {
//       xs: "12px",
//       sm: "14px",
//       base: "16px",
//       lg: "18px",
//       xl: "20px",
//     };

//     document.documentElement.style.fontSize = sizes[fontSize] || "";
//   }, [fontSize]);

//   return null;
// }
