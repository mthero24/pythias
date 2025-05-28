import React from "react";
import styled from "styled-components";
const Photo = styled.div`
    border-radius: 16px;
    overflow: hidden;
    5px 5px 21px 6px rgba(0,0,0,0.11);
`;

const Photo1 = styled(Photo)`
    transform: translate(60px, 60px) scale(1.25);
    flex: 1;
`;

const Photo2 = styled(Photo)`
    flex: 1;
    z-index: 1;
`;

const Photo3 = styled(Photo)`
    transform: translate(-60px, -60px) scale(1.25);
    flex: 1;
`;

const Collage = ({images}) => {
  return (
    <div style={{
        display: 'flex',
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
        height: '100%',
        overflow: 'hidden'
    }}>
      <Photo1>
        <img className="img-fluid" src="https://image.shutterstock.com/image-photo/man-printing-on-t-shirt-600w-1619486323.jpg" />
      </Photo1>
      <Photo2>
        <img className="img-fluid" src="https://image.shutterstock.com/image-photo/portrait-photo-young-asian-man-600w-1660417183.jpg" />
      </Photo2>
      <Photo3>
        <img className="img-fluid" src="https://image.shutterstock.com/image-photo/screen-print-t-shirt-design-600w-1709205238.jpg" />
      </Photo3>
    </div>
  );
};

export default Collage;
