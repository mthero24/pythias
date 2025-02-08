import { Box as MuiBox } from "@mui/material";
import { applyShorthandStyles } from "./_shorthandStyles";

const Row = ({ children, sx, ...props }) => {
  let shorthandStyles = applyShorthandStyles(props);
  return <MuiBox sx={{
    display:'flex',
    flexDirection:"row",
    ...sx, ...shorthandStyles.sx}} {...shorthandStyles.props}>{children}</MuiBox>;
};

export default Row;
