import Box from "./Box";
import Text from "./Text";
import { applyShorthandStyles } from "./_shorthandStyles";

const defaultDark = "#1279DC";
const defaultLight = "#FFF";

const getDarkColor = (color) => {
  if (!isColorLight(color)) {
    return color;
  }
  return defaultDark;
};

const getLightColor = (color) => {
  if (isColorLight(color)) {
    return color;
  }
  return defaultLight;
};

const SIZES = {
  small: {
    fontSize: 14,
    py: 1,
  },
  default: {
    fontSize: 16,
    py: "12px",
  },
};

const Button = ({
  primaryColor = "#1279DC",
  secondaryColor = "#1279DC",
  size,
  variant,
  children,
  fullWidth,
  sx,
  ...props
}) => {

  console.log(primaryColor, 'pc')

  if(!primaryColor) primaryColor = "#1279DC";
  if(!secondaryColor) secondaryColor = "#1279DC";

  const darkColor = getDarkColor(primaryColor);
  const lightColor = getLightColor(secondaryColor);
  let shorthandStyles = applyShorthandStyles(props);

  let sizeProps = SIZES["default"];
  if (size && SIZES[size]) {
    sizeProps = SIZES[size];
  }

  let backgroundColor;
  let border;
  let color = darkColor;
  if (variant == "contained") {
    backgroundColor = darkColor;
    color = lightColor;
  }
  if (variant == "outlined") {
    backgroundColor = "#fff";
    border = `1px solid ${darkColor}`;
    color = darkColor;
  }

  return (
    <Box display={fullWidth ? "flex" : "inline-block"}>
      <Box
        py={sizeProps.py}
        px={"40px"}
        cursor="pointer"
        jc="center"
        ai="center"
        backgroundColor={backgroundColor}
        color={color}
        border={border}
        borderRadius={1}
        transition="all 0.2s"
        hover={{ opacity: 0.6 }}
        sx={{
          ...sx,
          ...shorthandStyles.sx,
        }}
        {...shorthandStyles.props}
      >
        <Text fontSize={sizeProps.fontSize} fontWeight={500}>
          {children}
        </Text>
      </Box>
    </Box>
  );
};

function isColorLight(color) {
  // Variables for red, green, blue values
  var r, g, b, hsp;

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );

    r = color[1];
    g = color[2];
    b = color[3];
  } else {
    // If hex --> Convert it to RGB: http://gist.github.com/983661
    color = +("0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&"));

    r = color >> 16;
    g = (color >> 8) & 255;
    b = color & 255;
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return true;
  } else {
    return false;
  }
}

export default Button;
