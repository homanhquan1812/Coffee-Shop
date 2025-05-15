require('dotenv').config()

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { pool } = require('../../../config/db')

class OrderController
{
    // [GET] /order
    async getAllOrders(req, res, next) {
        try {
            const orderQuery = `SELECT * FROM "order";`
            const orderResult = await pool.query(orderQuery)

            res.status(200).json({
                order: orderResult.rows
            })
        } catch (error) {
            next(error)
        }
    }

    // [POST] /order
    async createAnOrder(req, res, next)
    {
        try {        
            const { customer_id, payment_method, cart } = req.body
            const branch_ids = [
                '3a7f5b90-12fd-4d2a-9c17-7e2a4c3d948e',
                'b5e0cfd4-b58f-4401-962d-6eec1f493c3a',
                '58c22b5e-6171-4903-bf48-f1cc6c536f15',
                'db275da2-9b63-4638-8fc6-7df0a0e7f2e0',
                '456aaf52-4262-4c91-a79a-cb647e8086d3',
                'f2c5c120-62de-48ec-a845-4eb1f33dd42e',
                'e758d3d7-2be0-4077-8468-1b5c059e1a04',
                'a81b13fa-9820-4fd6-946b-7a3534e9b7c0',
                '760c511e-c933-4a7d-8b1a-5aa39d6b46de',
                'd8edc4e6-1988-4cd4-b679-1c6de39992b1'
            ]
            const branch_id = branch_ids[Math.floor(Math.random() * branch_ids.length)]
            const insertOrderQuery = `
                INSERT INTO "order" (customer_id, branch_id, status, payment_method, cart)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `
            const orderResult = await pool.query(insertOrderQuery, [
                customer_id, 
                branch_id, 'Processing', payment_method, cart])
            const newOrder = orderResult.rows[0]
            const userQuery = `SELECT * FROM member_information INNER JOIN customer ON customer.member_information_id = member_information.id WHERE customer.id = $1;`
            const userResult = await pool.query(userQuery, [customer_id])

            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }

            const userMatch = userResult.rows[0]
            const resetCartQuery = `
                UPDATE customer
                SET cart = '{"total_price": 0, "items": []}'
                WHERE id = $1
            `
            await pool.query(resetCartQuery, [userMatch.id])

            res.status(201).json({
                message: "Order created successfully and user's cart has been reset.",
                order: newOrder
            })
        } catch (error) {
            next(error)
        }
    }

    // [PUT] /employee/order/:id
    async orderDelivered(req, res, next)
    {
        try {
            const id = req.params.id
            const checkOrderQuery = 'SELECT * FROM "order" WHERE id = $1'
            const orderResult = await pool.query(checkOrderQuery, [id])

            if (orderResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Order not found'
                })
            }

            const updateOrderQuery = `
                UPDATE "order"
                SET status = 'Delivered'
                WHERE id = $1
                RETURNING *
            `;
            const updatedOrderResult = await pool.query(updateOrderQuery, [id])
            const updatedOrder = updatedOrderResult.rows[0]

            res.status(200).json({
                message: 'Order delivered.',
                order: updatedOrder
            })
        } catch (error) {
            next(error)
        }
    }

    // [PUT] /manager/order/:id
    async orderDeclined(req, res, next)
    {
        try {
            const id = req.params.id
            const checkOrderQuery = 'SELECT * FROM "order" WHERE id = $1'
            const orderResult = await pool.query(checkOrderQuery, [id])

            if (orderResult.rows.length === 0) {
                return res.status(404).json({
                    message: 'Order not found'
                })
            }

            const updateOrderQuery = `
                UPDATE "order"
                SET status = 'Declined'
                WHERE id = $1
                RETURNING *
            `;
            const updatedOrderResult = await pool.query(updateOrderQuery, [id])
            const updatedOrder = updatedOrderResult.rows[0]

            res.status(200).json({
                message: 'Order declined.',
                order: updatedOrder
            })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = new OrderController