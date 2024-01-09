const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const datefns = require('date-fns')

const app = express()

app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = undefined

const startDbServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  })
}

startDbServer()

const isStatusValid = status => {
  const result =
    status === 'TO DO' ||
    status === 'IN PROGRESS' ||
    status === 'DONE' ||
    status === ''
  return result
}

const isPriorityValid = priority => {
  return (
    priority === 'LOW' ||
    priority === 'MEDIUM' ||
    priority === 'HIGH' ||
    priority === ''
  )
}

const isCategoryValid = category => {
  return (
    category === 'WORK' ||
    category === 'HOME' ||
    category === 'LEARNING' ||
    category === ''
  )
}

const isDateValid = dueDate => {
  const result = datefns.isValid(new Date(dueDate)) || dueDate === ''
  return result
}

app.get('/todos/', async (req, res) => {
  const {
    search_q = '',
    priority = '',
    status = '',
    category = '',
    dueDate = '',
  } = req.query

  if (!isStatusValid(status)) {
    res.status(400)
    res.send('Invalid Todo Status')
  } else if (!isPriorityValid(priority)) {
    res.status(400)
    res.send('Invalid Todo Priority')
  } else if (!isCategoryValid(category)) {
    res.status(400)
    res.send('Invalid Todo Category')
  } else if (!isDateValid(dueDate)) {
    res.status(400)
    res.send('Invalid Due Date')
  } else {
    res.send(
      await db.all(
        `select id, todo, priority, status, category, due_date as dueDate from todo where priority like '%${priority}%' and todo like '%${search_q}%'
      and status like '%${status}%' and category like '%${category}%' and due_date like '%${dueDate}%'`,
      ),
    )
  }
})

app.get('/todos/:id', async (req, res) => {
  const {id} = req.params
  res.send(
    await db.get(
      `select id, todo, priority, status, category, due_date as dueDate from todo where id = ${id}`,
    ),
  )
})

app.get('/agenda/', async (req, res) => {
  const {date} = req.query

  console.log(new Date(date) !== 'Invalid Date')

  if (datefns.isValid(new Date(date))) {
    const dateObj = new Date(date)
    const requiredDate = datefns.format(dateObj, 'yyyy-MM-dd')
    res.send(
      await db.all(
        `select id, todo, priority, status, category, due_date as dueDate from todo where due_date = '${requiredDate}'`,
      ),
    )
  } else {
    res.status(400)
    res.send('Invalid Due Date')
  }
})

app.post('/todos/', async (req, res) => {
  const statusValid = isStatusValid(req.body.status) && req.body.status !== ''
  const priorityValid =
    isPriorityValid(req.body.priority) && req.body.priority !== ''
  const categoryValid =
    isCategoryValid(req.body.category) && req.body.category !== ''
  const dateValid = isDateValid(req.body.dueDate) && req.body.dueDate !== ''

  if (statusValid && priorityValid && categoryValid && dateValid) {
    await db.run(
      `insert into todo values (${req.body.id}, '${req.body.todo}', '${req.body.priority}', '${req.body.status}', '${req.body.category}', '${req.body.dueDate}')`,
    )
    res.send('Todo Successfully Added')
  } else if (!statusValid) {
    res.status(400)
    res.send('Invalid Todo Status')
  } else if (!priorityValid) {
    res.status(400)
    res.send('Invalid Todo Priority')
  } else if (!categoryValid) {
    res.status(400)
    res.send('Invalid Todo Category')
  } else if (!dateValid) {
    res.status(400)
    res.send('Invalid Due Date')
  }
})

app.put('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  const {status, priority, category, dueDate, todo} = req.body

  if (todo != undefined) {
    await db.run(`update todo set todo = '${todo}' where id = ${todoId}`)
    res.send('Todo Updated')
  }

  if (status != undefined && isStatusValid(status) && status !== '') {
    await db.run(`update todo set status = '${status}' where id = ${todoId}`)
    res.send('Status Updated')
  } else if (status != undefined && !isStatusValid(status)) {
    res.status(400)
    res.send('Invalid Todo Status')
  }

  if (priority != undefined && isPriorityValid(priority) && priority !== '') {
    await db.run(
      `update todo set priority = '${priority}' where id = ${todoId}`,
    )
    res.send('Priority Updated')
  } else if (priority != undefined && !isPriorityValid(priority)) {
    res.status(400)
    res.send('Invalid Todo Priority')
  }

  if (category != undefined && isCategoryValid(category) && category !== '') {
    await db.run(
      `update todo set category = '${category}' where id = ${todoId}`,
    )
    res.send('Category Updated')
  } else if (category != undefined && !isCategoryValid(category)) {
    res.status(400)
    res.send('Invalid Todo Category')
  }

  if (dueDate != undefined && isDateValid(dueDate) && dueDate !== '') {
    await db.run(`update todo set due_date = '${dueDate}' where id = ${todoId}`)
    res.send('Due Date Updated')
  } else if (dueDate != undefined && !isDateValid(dueDate)) {
    res.status(400)
    res.send('Invalid Due Date')
  }
})

app.delete('/todos/:todoId/', async (req, res) => {
  const {todoId} = req.params
  await db.run(`delete from todo where id = ${todoId}`)
  res.send('Todo Deleted')
})

app.listen(3000, () => {
  console.log('server started.')
})

module.exports = app
