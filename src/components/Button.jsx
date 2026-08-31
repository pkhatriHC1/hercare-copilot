// Local Button replacement for @hc1/design-system Button.
// Matches the design tokens used throughout this app (C.* palette).
const C = {
  grey:    { 100:"#FFFFFF", 200:"#F7F7F7", 300:"#E7E7E7", 400:"#CFD1D1", 500:"#A8ADAD", 600:"#737E7F", 700:"#545D5E", 800:"#273233" },
  primary: { 500:"#0D7782", 600:"#0B626B" },
  orange:  { 400:"#F58126" },
};
const font = "'Source Sans Pro',system-ui,sans-serif";

const variants = {
  primary:   { background: C.primary[600], color: "#fff", border: "none" },
  secondary: { background: C.grey[200],    color: C.grey[800], border: `1px solid ${C.grey[300]}` },
  cta:       { background: C.orange[400],  color: "#fff", border: "none" },
};

const sizes = {
  sm: { padding: "7px 16px", fontSize: 13 },
  md: { padding: "10px 20px", fontSize: 14 },
};

export const Button = ({ variant = "primary", size = "md", children, style, ...rest }) => {
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      {...rest}
      style={{
        fontFamily: font,
        fontWeight: 600,
        borderRadius: 8,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        lineHeight: 1,
        transition: "filter 0.15s, background 0.15s",
        ...v,
        ...s,
        ...style,
      }}
      onMouseEnter={e => { if (rest.onMouseEnter) rest.onMouseEnter(e); else e.currentTarget.style.filter = "brightness(0.94)"; }}
      onMouseLeave={e => { if (rest.onMouseLeave) rest.onMouseLeave(e); else e.currentTarget.style.filter = "none"; }}
    >
      {children}
    </button>
  );
};

export default Button;
