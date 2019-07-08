const serializeError = require('serialize-error')
const path = require('path')

const use_promise = process.env.SERVERLESS_OFFLINE_PROMISE || false

let handler = null

if (use_promise) {
  handler = async (event, context) => {
    try {
      const [
        targetHandlerFile,
        targetHandlerFunction,
      ] = event.targetHandler.split('.')
      const target = require(path.resolve(
        __dirname,
        '../..',
        targetHandlerFile,
      ))

      const response = await target[targetHandlerFunction](event.body, context)

      return Promise.resolve(response)
    } catch (error) {
      return Promise.reject(error)
    }
  }
} else {
  handler = (event, context, callback) => {
    const [
      targetHandlerFile,
      targetHandlerFunction,
    ] = event.targetHandler.split('.')
    const target = require(path.resolve(__dirname, '../..', targetHandlerFile))

    target[targetHandlerFunction](event.body, context, (error, response) => {
      if (error) {
        // Return Serverless error to AWS sdk
        callback(null, {
          StatusCode: 500,
          FunctionError: 'Handled',
          Payload: serializeError(error),
        })
      } else {
        // Return lambda function response to AWS SDK & pass through args from serverless.
        callback(null, response)
      }
    })
  }
}

module.exports.handler = handler
