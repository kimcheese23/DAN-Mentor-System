import { CDBBox, CDBContainer } from 'cdbreact';

const Footer = () => {
  return (
    <CDBBox className="shadow bg-primary d-flex align-items-center" style={{ height: '50px' }}>
      <CDBContainer>
        <p className="text-center text-white m-0">&copy; 2026 MentorMe</p>
      </CDBContainer>
    </CDBBox>
  );
};

export default Footer;
