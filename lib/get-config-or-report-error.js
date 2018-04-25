const reportIssue = require('./report-issue')

module.exports = async (context, filename, handler) => {
  try {
    return await context.config(filename)
  } catch (err) {
    await reportIssue(context, handler(err))
    throw err
  }
}
