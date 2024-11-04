import React, { useState } from 'react';
import './App.css';
import AWS from 'aws-sdk';
import axios from 'axios'

function App() {
    const [counts, setCounts] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
    const [roomNumber, setRoomNumber] = useState('');
    const [language, setLanguage] = useState('en');
    const [signatureUrl, setSignatureUrl] = useState('');

    // Translation object for supported languages with meal type emojis
    const translations = {
        en: {
            roomLabel: 'Room Number',
            languageLabel: 'Language',
            selectMeals: 'Select Meals',
            breakfast: '☀️ Breakfast',
            lunch: '🌞 Lunch',
            dinner: '🌙 Dinner',
            signature: 'Signature',
            clearSignature: 'Clear Signature',
            submitOrder: 'Submit Order',
        },
        es: {
            roomLabel: 'Número de Habitación',
            languageLabel: 'Idioma',
            selectMeals: 'Seleccionar Comidas',
            breakfast: '☀️ Desayuno',
            lunch: '🌞 Almuerzo',
            dinner: '🌙 Cena',
            signature: 'Firma',
            clearSignature: 'Borrar Firma',
            submitOrder: 'Enviar Pedido',
        },
        zh: {
            roomLabel: '房间号',
            languageLabel: '语言',
            selectMeals: '选择餐点',
            breakfast: '☀️ 早餐',
            lunch: '🌞 午餐',
            dinner: '🌙 晚餐',
            signature: '签名',
            clearSignature: '清除签名',
            submitOrder: '提交订单',
        },
        ru: {
            roomLabel: 'Номер комнаты',
            languageLabel: 'Язык',
            selectMeals: 'Выбрать блюда',
            breakfast: '☀️ Завтрак',
            lunch: '🌞 Обед',
            dinner: '🌙 Ужин',
            signature: 'Подпись',
            clearSignature: 'Очистить подпись',
            submitOrder: 'Отправить заказ',
        },
        bn: {
            roomLabel: 'কক্ষ নম্বর',
            languageLabel: 'ভাষা',
            selectMeals: 'খাবার নির্বাচন করুন',
            breakfast: '☀️ প্রাতঃরাশ',
            lunch: '🌞 মধ্যাহ্নভোজন',
            dinner: '🌙 রাতের খাবার',
            signature: 'স্বাক্ষর',
            clearSignature: 'স্বাক্ষর মুছুন',
            submitOrder: 'অর্ডার জমা দিন',
        },
        ko: {
            roomLabel: '방 번호',
            languageLabel: '언어',
            selectMeals: '식사 선택',
            breakfast: '☀️ 아침',
            lunch: '🌞 점심',
            dinner: '🌙 저녁',
            signature: '서명',
            clearSignature: '서명 지우기',
            submitOrder: '주문 제출',
        },
        ht: {
            roomLabel: 'Nimewo chanm',
            languageLabel: 'Lang',
            selectMeals: 'Chwazi Repa',
            breakfast: '☀️ Dejene',
            lunch: '🌞 Manje midi',
            dinner: '🌙 Manje aswè',
            signature: 'Siyati',
            clearSignature: 'Efase Siyati',
            submitOrder: 'Voye lòd la',
        },
        ar: {
            roomLabel: 'رقم الغرفة',
            languageLabel: 'اللغة',
            selectMeals: 'اختر الوجبات',
            breakfast: '☀️ الإفطار',
            lunch: '🌞 الغداء',
            dinner: '🌙 العشاء',
            signature: 'التوقيع',
            clearSignature: 'مسح التوقيع',
            submitOrder: 'إرسال الطلب',
        },
        fr: {
            roomLabel: 'Numéro de chambre',
            languageLabel: 'Langue',
            selectMeals: 'Sélectionnez les repas',
            breakfast: '☀️ Petit déjeuner',
            lunch: '🌞 Déjeuner',
            dinner: '🌙 Dîner',
            signature: 'Signature',
            clearSignature: 'Effacer la signature',
            submitOrder: 'Envoyer la commande',
        },
        ur: {
            roomLabel: 'کمرے کا نمبر',
            languageLabel: 'زبان',
            selectMeals: 'کھانے کا انتخاب کریں',
            breakfast: '☀️ ناشتہ',
            lunch: '🌞 دوپہر کا کھانا',
            dinner: '🌙 رات کا کھانا',
            signature: 'دستخط',
            clearSignature: 'دستخط صاف کریں',
            submitOrder: 'آرڈر جمع کروائیں',
        },
    };

    const adjustCount = (meal, change) => {
        setCounts((prevCounts) => ({
            ...prevCounts,
            [meal]: Math.max(0, prevCounts[meal] + change),
        }));
    };

    const clearSignature = () => {
        const canvas = document.getElementById('signature-pad');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const submitOrder = async () => {
        if (!roomNumber || (counts.breakfast === 0 && counts.lunch === 0 && counts.dinner === 0)) {
            alert('Please enter all the details!');
            return;
        }

        const canvas = document.getElementById('signature-pad');
        const signatureDataUrl = canvas.toDataURL('image/png');
        const orderData = {
            roomNumber,
            language,
            meals: counts,
            // signatureUrl: await uploadSignatureToS3(signatureDataUrl),
            signS3url: 'testing url',
            created_at: new Date().toISOString()
        };

        console.log(orderData)
        const response = await axios.post('http://localhost:5000/api/submit-order', {
            data: orderData
        }).then((res) => {
            console.log('Order submitted -> ', res)
            alert(res.data.message);
        }).catch((err) => {
            console.log('Error Submitting order -> ', err)
            // alert(err.data.error);
        })


    };

    const uploadSignatureToS3 = async (signatureDataUrl) => {
        const s3 = new AWS.S3({
            accessKeyId: 'YOUR_ACCESS_KEY_ID',
            secretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
            region: 'YOUR_AWS_REGION',
        });

        const base64Data = signatureDataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = new Buffer(base64Data, 'base64');
        const fileName = `signatures/${Date.now()}.png`;

        const params = {
            Bucket: 'your-s3-bucket-name',
            Key: fileName,
            Body: buffer,
            ContentEncoding: 'base64',
            ContentType: 'image/png',
        };

        try {
            const data = await s3.upload(params).promise();
            return data.Location;
        } catch (err) {
            console.error('Error uploading signature:', err);
            return '';
        }
    };

    const changeLanguage = (e) => {
        setLanguage(e.target.value);
    };

    return (
        <div className="container">
            <div className="header">
                <div className="room-input-wrapper">
                    <div className="room-input">
                        <label htmlFor="room">{translations[language].roomLabel}</label>
                        <input
                            type="number"
                            id="room"
                            name="room"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            placeholder={translations[language].roomLabel}
                            required
                        />
                    </div>
                    <div className="room-input">
                        <label htmlFor="language">{translations[language].languageLabel}</label>
                        <select id="language" name="language" value={language} onChange={changeLanguage}>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="zh">中文</option>
                            <option value="ru">Русский</option>
                            <option value="bn">বাংলা</option>
                            <option value="ko">한국어</option>
                            <option value="ht">Kreyòl Ayisyen</option>
                            <option value="ar">العربية</option>
                            <option value="fr">Français</option>
                            <option value="ur">اردو</option>
                        </select>
                    </div>
                </div>
                <img
                    src="https://d161ew7sqkx7j0.cloudfront.net/public/images/logos/6698_2300_Childrens_Rescue_Fund_Logo_Final.png"
                    alt="Children's Rescue Fund Logo"
                    className="logo"
                />
            </div>

            <div className="main-content">
                <div className="order-section">
                    <h2 className="section-title">{translations[language].selectMeals}</h2>
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                        <div key={meal} className="meal-counter">
                            <span>{translations[language][meal]}</span>
                            <div className="counter-controls">
                                <button className="counter-btn" onClick={() => adjustCount(meal, -1)}>-</button>
                                <span className="counter-display">{counts[meal]}</span>
                                <button className="counter-btn" onClick={() => adjustCount(meal, 1)}>+</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="signature-section">
                    <h2 className="section-title">{translations[language].signature}</h2>
                    <canvas id="signature-pad" role="img" aria-label="Signature pad for signing"></canvas>
                    <button id="clear-sig" onClick={clearSignature}>
                        {translations[language].clearSignature}
                    </button>
                </div>
            </div>

            <button id="submit-btn" onClick={submitOrder}>
                {translations[language].submitOrder}
            </button>
        </div>
    );
}

export default App;
