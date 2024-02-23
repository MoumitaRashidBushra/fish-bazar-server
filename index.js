const express = require('express');
//const multer = require('multer');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const stripe = require('stripe')(process.env.SECRET_KEY)
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });


//console.log(process.env.DB_PASS)


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' });
    }

    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthorized Access' })
        }
        req.decoded = decoded;
        next();
    })
}




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.idh7yj4.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {


        //await 
        client.connect();

        const usersCollection = client.db("fishBazar").collection("users");
        const fishCollection = client.db("fishBazar").collection("fish");
        const myCartCollection = client.db("fishBazar").collection("myCart");
        const paymentCollection = client.db("fishBazar").collection("payment");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' })

            res.send({ token })
        })

        //admin verify

        // const verifyAdmin = async (req, res, next) => {
        //     const email = req.decoded.email;
        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query);
        //     if (user?.role !== 'admin') {
        //         return res.status(403).send({ error: true, message: 'forbidden message' });
        //     }
        //     next();
        // }

        //Seller verify

        // const verifyInstructor = async (req, res, next) => {
        //     const email = req.decoded.email;
        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query);
        //     if (user?.role !== 'instructor') {
        //         return res.status(403).send({ error: true, message: 'forbidden message' });
        //     }
        //     next();
        // }

        //user verify

        // const verifyStudent = async (req, res, next) => {
        //     const email = req.decoded.email;
        //     const query = { email: email }
        //     const user = await usersCollection.findOne(query);
        //     if (user?.role !== 'student') {
        //         return res.status(403).send({ error: true, message: 'forbidden message' });
        //     }
        //     next();
        // }


        //user insert database
        app.post('/users', async (req, res) => {
            const user = req.body;
            user.role = 'fishuser';


            const query = { email: user.email }
            const existsUser = await usersCollection.findOne(query);

            if (existsUser) {
                return res.send({ message: 'user already exists' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        //get all user for manage all user 
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        //make Admin
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateAdmin = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await usersCollection.updateOne(filter, updateAdmin);
            res.send(result);

        });

        //Make seller
        app.patch('/users/seller/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateSeller = {
                $set: {
                    role: 'seller'
                },
            };

            const result = await usersCollection.updateOne(filter, updateSeller);
            res.send(result);

        })



        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email }
            const user = await usersCollection.findOne(query);

            if (user.role === 'admin') {
                res.send({ roles: "admin" });
            }
            else if (user.role === 'seller') {
                res.send({ roles: "seller" });
            }
            else {
                res.send({ roles: "fishuser" });
            }

        })
        //show seller
        app.get('/seller', async (req, res) => {
            const email = req.params.email;
            const query = { role: 'seller' }
            const result = await usersCollection.find(query).toArray();
            res.send(result);


        })


        // //show seller in home page
        app.get('/homeSeller', async (req, res) => {
            const email = req.params.email;
            const query = { role: 'seller' }
            const result = await usersCollection.find(query).limit(6).toArray();
            res.send(result);


        })




        //fish Collection

        // add seller classes in database


        app.post('/fish', async (req, res) => {
            const newItem = req.body;
            const result = await fishCollection.insertOne(newItem)
            res.send(result);
        })




        //manage all class
        //verifyJWT,
        app.get('/fish', async (req, res) => {
            const result = await fishCollection.find().toArray();
            res.send(result);
        })





        // // popular fish in home
        app.get('/popularFish', async (req, res) => {
            const email = req.params.email;
            const query = { status: 'Approved' }
            const result = await fishCollection.find(query).sort({ buy: -1 }).limit(6).toArray();
            res.send(result);


        })



        //Fish page show in approved fishies

        app.get('/showApprovedFish', async (req, res) => {
            const email = req.params.email;
            const query = { status: 'Approved' }
            const result = await fishCollection.find(query).toArray();
            res.send(result);


        })

        //admin approved the class

        app.patch('/approved/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateStatus = {
                $set: {
                    status: 'Approved'
                },
            };

            const result = await fishCollection.updateOne(filter, updateStatus);
            res.send(result);

        })


        //admin deny the class

        app.patch('/deny/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateStatus = {
                $set: {
                    status: 'Deny'
                },
            };

            const result = await fishCollection.updateOne(filter, updateStatus);
            res.send(result);

        })

        //feedback

        app.get('/feedback/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await fishCollection.findOne(query);
            res.send(result);

        })

        //view fish details
        app.get('/selectedFish/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const selectedFish = await fishCollection.findOne(query)
            res.send(selectedFish)
        })


        //update the feedback

        app.patch('/updatefeedback/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateFeedback = req.body;
            const updateStatus = {
                $set: {
                    feedback: updateFeedback.feedback
                },
            };

            const result = await fishCollection.updateOne(filter, updateStatus);
            res.send(result);

        })



        // //myAddFish in seller

        app.get('/myAddFish/:email', async (req, res) => {
            //verifyJWT,

            const email = req.params.email;
            console.log(email)
            const query = {
                sellerEmail: email
            }

            const result = await fishCollection.find(query).toArray();
            res.send(result);
        });


        //seller fish update info

        app.get('/fishUpdateInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await fishCollection.findOne(query);
            res.send(result);

        })


        // //fish update info seller
        app.put('/sellerUpdateInfo/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedFishInfo = req.body;
            const fishInfo = {
                $set: {

                    details: updatedFishInfo.details,
                    availableFish: updatedFishInfo.availableFish,
                    price: updatedFishInfo.price

                }
            }
            const result = await fishCollection.updateOne(filter, fishInfo, options);
            res.send(result);
        })




        // //myCart collection 

        // //add database in myCart fish

        app.post('/myCartInfo', async (req, res) => {
            const newItem = req.body;
            const result = await myCartCollection.insertOne(newItem)
            res.send(result);
        })

        // //show my selected class


        app.get('/myCartSelectInfo/:email', async (req, res) => {
            //verifyJWT,

            const email = req.params.email;
            console.log(email)
            const query = {
                usermail: email
            }

            const result = await myCartCollection.find(query).toArray();
            res.send(result);
        });

        //delete my selected class 
        app.delete('/myCartSelectInfo/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await myCartCollection.deleteOne(query);
            res.send(result);
        })


        //payment
        app.post('/create-payment-intent', async (req, res) => {
            const { totalAmount } = req.body;
            const amount = parseInt(totalAmount * 100);
            console.log(amount, 'amount inside the intent')

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        });







        app.post('/payments', async (req, res) => {
            try {
                const payment = req.body;
                const insertResult = await paymentCollection.insertOne(payment);

                // Create an array of ObjectIds from the cartIds
                const cartItemIds = payment.cartIds.map(id => new ObjectId(id));

                // Find the items in the cart
                const cartItems = await myCartCollection.find({ _id: { $in: cartItemIds } }).toArray();

                // Create an array of ObjectIds from the fishItemIds
                const fishItemIds = payment.fishItemIds.map(id => new ObjectId(id));

                // Update the availableFish and buy count for each item in the fishCollection
                const updatePromises = cartItems.map(async (cartItem) => {
                    const fishId = new ObjectId(cartItem.fishId);
                    const quantity = cartItem.quantity;

                    const updateDoc = {
                        $inc: {
                            availableFish: -quantity,
                            buy: quantity,
                        }
                    };

                    return fishCollection.updateOne({ _id: fishId }, updateDoc);
                });

                // Wait for all updates to complete
                await Promise.all(updatePromises);

                // Delete the items from the cart
                const deleteResult = await myCartCollection.deleteMany({ _id: { $in: cartItemIds } });

                res.send({ insertResult, deleteResult });
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });




        //payment history

        app.get('/payments/:email', async (req, res) => {
            //verifyJWT,

            const email = req.params.email;

            const query = {
                email: email
            }

            const result = await paymentCollection.find(query).sort({ date: -1 }).toArray();
            res.send(result);
        });


        //buy fish Classess

        app.get('/buy/:email', async (req, res) => {
            try {
                const email = req.params.email;
                const query = { email: email };

                const paymentData = await paymentCollection.find(query).toArray();

                if (!paymentData || paymentData.length === 0) {
                    // No payment data found for the user
                    return res.status(404).send({ error: 'No payment data found for the user' });
                }

                // Extract fishItemIds and convert them to ObjectId
                const fishItemIds = paymentData.flatMap(item => item.fishItemIds.map(id => new ObjectId(id)));

                if (fishItemIds.length === 0) {
                    // No fish items found for the user
                    return res.status(404).send({ error: 'No fish items found for the user' });
                }

                const classes = await fishCollection.find({
                    _id: { $in: fishItemIds }
                }).toArray();

                res.send(classes);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: `Internal Server Error: ${error.message}` });
            }
        });


        // stats or analytics
        app.get('/admin-stats', async (req, res) => {
            //verifyToken, verifyAdmin,
            const users = await usersCollection.estimatedDocumentCount();
            const fishItems = await fishCollection.estimatedDocumentCount();
            const orders = await paymentCollection.estimatedDocumentCount();



            const result = await paymentCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalRevenue: {
                            $sum: '$totalAmount'
                        }
                    }
                }
            ]).toArray();

            const revenue = result.length > 0 ? result[0].totalRevenue : 0;

            res.send({
                users,
                fishItems,
                orders,
                revenue
            })
        })


        // order status
        /**
         * ----------------------------
         *    NON-Efficient Way
         * ------------------------------
         * 1. load all the payments
         * 2. for every menuItemIds (which is an array), go find the item from menu collection
         * 3. for every item in the menu collection that you found from a payment entry (document)
        */

        // using aggregate pipeline
        // app.get('/order-stats', async (req, res) => {
        //     //verifyToken, verifyAdmin,
        //     const pipeline = [
        //         {
        //             $match: {
        //                 fishItemsIds: { $exists: true, $ne: [] }
        //             }
        //         },
        //         {
        //             $unwind: '$fishItemsIds'
        //         },
        //         {
        //             $lookup: {
        //                 from: 'fish',
        //                 localField: 'fishItemsIds',
        //                 foreignField: '_id',
        //                 as: 'fishItems'
        //             }
        //         },
        //         {
        //             $unwind: '$fishItems'
        //         },
        //         {
        //             $group: {
        //                 _id: '$fishItems.category',
        //                 itemCount: { $sum: 1 },
        //                 totalAmount: { $sum: '$fishItems.totalAmount' }
        //             }
        //         }
        //     ];

        //     const result = await db.collection('fishBazar').aggregate(pipeline).toArray();

        //     res.json(result);
        // })

        // ...

        // order status
        // ...

        // order status
        // ...

        app.get('/fishItemsStats', async (req, res) => {
            try {
                const pipeline = [
                    {
                        $unwind: '$fishItemIds'
                    },
                    {
                        $lookup: {
                            from: 'fish',
                            localField: 'fishItemIds',
                            foreignField: '_id',
                            as: 'fishItems'
                        }
                    },
                    {
                        $unwind: '$fishItems'
                    },
                    {
                        $group: {
                            _id: '$fishItems.category',
                            itemCount: { $sum: 1 },
                            totalAmount: { $sum: '$fishItems.price' }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            category: '$_id',
                            itemCount: '$itemCount',
                            totalAmount: '$totalAmount'
                        }
                    }
                ];

                const result = await paymentCollection.aggregate(pipeline).toArray();

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ error: 'Internal Server Error' });
            }
        });

        // ...


        // ...


        // ...


















        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        //await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Fish Bazar is Swimming')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})