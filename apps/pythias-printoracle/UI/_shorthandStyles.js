const shorthandStyles = {
    flex: 'flex',
    bg: 'background',
    background: 'background',
    backgroundColor: 'backgroundColor',
    bgColor: 'background',
    mr: 'marginRight',
    marginRight: 'marginRight',
    marginLeft: 'marginLeft',
    ml: 'marginLeft',
    mt: 'mt',
    mb: 'mb',
    mx: 'mx',
    display: 'display',
    my: 'my',
    p: 'padding',
    pb: 'paddingBottom',
    px: 'px',
    pl: 'paddingLeft',
    pr: 'paddingRight',
    py: 'py',
    fontWeight: 'fontWeight',
    fontSize: 'fontSize',
    width: 'width',
    height: 'height',
    w: 'width',
    h: 'height',
    position: 'position',
    left: 'left',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    color: 'color',
    justifyContent: 'justifyContent',
    alignItems: 'alignItems',
    overflow: 'overflow',
    overflowY: 'overflowY',
    overflowX: 'overflowX',
    zIndex: 'zIndex',
    borderRadius: 'borderRadius',
    borderWidth: 'borderWidth',
    borderColor: 'borderColor',
    minW: 'minWidth',
    maxW: 'maxWidth',
    maxH: 'maxHeight',
    maxHeight: 'maxHeight',
    maxWidth: 'maxWidth',
    minH: 'minHeight',
    pointerEvents: 'pointerEvents',
    flexDir: 'flexDirection',
    flexDirection: 'flexDirection',
    borderColor: 'borderColor',
    jc: 'justifyContent',
    ai: 'alignItems',
    transform: 'transform',
    opacity: 'opacity',
    flexWrap: 'flexWrap',
    borderBottomWidth: 'borderBottomWidth',
    borderLeftWidth: 'borderLeftWidth',
    borderRightWidth: 'borderRightWidth',
    borderTopWidth: 'borderTopWidth',
    pt: 'paddingTop',
    outlineWidth: 'outlineWidth',
    outlineColor: 'outlineColor',
    outlineStyle: 'outlineStyle',
    m: 'margin',
    shadow: 'boxShadow',
    aspectRatio: 'aspectRatio',
    textAlign: 'textAlign',
    elevation: 'elevation',
    textTransform: 'textTransform',
    space:'gap',
    hover:'&:hover',
    cursor:'cursor',
    transition:'transition'
    // Add more shorthand props and corresponding styles here
  };


  export const applyShorthandStyles = (props) => {
    let updatedProps = {...props};
    let sx = {};
    for (const prop in props) {
      if (shorthandStyles[prop]) {
        let key = shorthandStyles[prop];
        let val = props[prop];
        sx[key] = val;
        delete updatedProps[prop];
      }
    }
    return {sx, props: updatedProps};
  };