import { Typography } from "@mui/material";
import { applyShorthandStyles } from "./_shorthandStyles";

const Text = ({ children, sx, ...props }) => {
  let shorthandStyles = applyShorthandStyles(props);
  return (
    <Typography
      sx={{
        display: "flex",
        flexDirection: "column",
        ...sx,
        ...shorthandStyles.sx,
      }}
      {...shorthandStyles.props}
    >
      {children}
    </Typography>
  );
};

export default Text;
