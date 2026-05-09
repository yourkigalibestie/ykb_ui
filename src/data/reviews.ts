export interface Review {
    id: number;
    author: string;
    rating: number;
    text: string;
    title: string;
}

export const reviews: Review[] = [
    {
        id: 1,
        author: "Jean-Luc Tuyishimire",
        rating: 5,
        title: "Life-Changing Service",
        text: "Your Kigali Bestie saved me countless hours. Their attention to detail and friendly approach made me feel supported from day one. Highly recommended!",
    },
    {
        id: 2,
        author: "Marie Uwase",
        rating: 5,
        title: "Professional and Reliable",
        text: "I hired them for event planning, and they exceeded my expectations. Every detail was perfect. They're truly the best concierge in Kigali.",
    },
    {
        id: 3,
        author: "David Mutua",
        rating: 5,
        title: "Trustworthy Partner",
        text: "As an expat, having a reliable local partner has been invaluable. Their house-sitting service gave me peace of mind while traveling.",
    },
    {
        id: 4,
        author: "Sophie Nkusi",
        rating: 5,
        title: "Excellent Translator",
        text: "Their translation services were flawless. They not only translated accurately but also explained cultural nuances. Exceptional!",
    },
];
