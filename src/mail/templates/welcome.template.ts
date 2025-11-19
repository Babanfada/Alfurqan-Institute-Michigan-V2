// src/utils/email-templates/emailTemplates.ts
import Mailgen from 'mailgen';
import moment from 'moment';

const mailGenerator = new Mailgen({
  theme: 'default',
  product: {
    name: 'AlFurqan Institute Michigan',
    link: '#',
    logo: 'https://res.cloudinary.com/dtrdvz70q/image/upload/v1733324658/Alfurqan%20Institue%20Michigan/alfuraqan_logo_2.jpg',
    logoHeight: '120px',
    copyright: `© ${new Date().getFullYear()} AlFurqan Institute Michigan. All rights reserved.`,
  },
});

// Social media icons + links
const socialMediaLinks = [
  {
    name: 'Facebook',
    icon: 'https://img.icons8.com/fluency/48/facebook.png',
    link: 'https://www.facebook.com/profile.php?id=61569614254645',
  },
  {
    name: 'Twitter',
    icon: 'https://img.icons8.com/color/48/twitter--v1.png',
    link: 'https://x.com/AlfurqanMich?t=BhE9yvT1wPGvlTjWaMxCBw&s=09',
  },
  {
    name: 'Instagram',
    icon: 'https://img.icons8.com/color/48/instagram-new--v1.png',
    link: 'https://www.instagram.com/alfurqanmichigan?igsh=OGlnb3U5YWloejcw',
  },
  {
    name: 'WhatsApp',
    icon: 'https://img.icons8.com/color/48/whatsapp--v1.png',
    link: '#',
  },
];

const socialIconsHTML = socialMediaLinks
  .map(
    (platform) =>
      `<a href="${platform.link}" target="_blank"><img src="${platform.icon}" alt="${platform.name}" /></a>`,
  )
  .join(' ');


// -------------------------------------------------------
// GENERATE GENERIC NOTIFICATION EMAIL
// -------------------------------------------------------
export const generateNotificationEmail = ({
  firstName,
  lastName,
  message,
}: {
  firstName: string;
  lastName: string;
  message: string;
}) => {
  const emailContent = {
    body: {
      greeting: 'Hello',
      name: `${firstName} ${lastName}`,
      intro: message,
      signature: 'Warm regards',
      dictionary: {
        date: moment().format('MMMM Do YYYY'),
        address: 'AlFurqan Institute Michigan',
        handles: socialIconsHTML,
      },
    },
  };

  return mailGenerator.generate(emailContent);
};
