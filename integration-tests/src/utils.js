class Response {
  constructor(status, data) {
    this.status = status
    this.data = data
  }
}

const promiseHandler = fn => (req, res) => {
  const handleValue = value => {
    if (value instanceof Response) {
      res.status(value.status).send(value.data)
    } else {
      console.error(value)
      res.status(500).send(value.toString())
    }
  }
  return fn(req, res).then(handleValue, handleValue)
}

const validateInput = (value, schema) => {
  const { error } = schema.validate(value)
  if (error) {
    throw new Response(400, error.message)
  }
}

module.exports = {
  Response,
  promiseHandler,
  validateInput
}
