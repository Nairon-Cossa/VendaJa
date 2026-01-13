import emailjs from '@emailjs/browser';

export const enviarEmailOTP = async (nome, email, loja, otp) => {
  const templateParams = {
    to_name: nome,
    to_email: email,
    otp_code: otp,
    store_name: loja
  };

  return emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    templateParams,
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  );
};