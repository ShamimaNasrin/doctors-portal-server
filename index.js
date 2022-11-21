const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

//middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.klfob8q.mongodb.net/?retryWrites=true&w=majority`;
//console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');

        //all appointment Option api
        // Use Aggregate to query multiple collection and then merge data
        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            //console.log(date);
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();

            // get the bookings of the provided date
            const bookingQuery = { appointmentDate: date };
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
            //console.log(alreadyBooked);

            // find the Bookedslots for a specific date
            options.forEach(option => {
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name);
                //console.log(optionBooked);
                const bookedSlots = optionBooked.map(booked => booked.slot);
                //filter the remaining available slots
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
                // console.log(date, option.name, remainingSlots.length);
            })
            res.send(options);
        })

        //sent booking info to mongodb
        app.post('/bookings', async (req, res) => {
            const bookingData = req.body;
            console.log(bookingData);
            const query = {
                appointmentDate: bookingData.appointmentDate,
                treatment: bookingData.treatment,
                email: bookingData.email
            }
            const alreadyBooked = await bookingsCollection.find(query).toArray();
            if (alreadyBooked.length) {
                const message = `You already have a booking on ${bookingData.appointmentDate}`
                return res.send({ acknowledged: false, message });
            }


            const result = await bookingsCollection.insertOne(bookingData);
            res.send(result);
        })

    }
    finally {

    }
}
run().catch(e => console.error(e));




app.get('/', async (req, res) => {
    res.send('doctor surver running');
})

app.listen(port, () => {
    console.log(`doctor server running on port: ${port}`)
})