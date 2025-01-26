// Generated by Selenium IDE
const { Builder, By, Key, until } = require('selenium-webdriver')
const assert = require('assert')

describe('TC22', function () {
    this.timeout(30000)
    let driver
    let vars
    beforeEach(async function () {
        driver = await new Builder().forBrowser('chrome').build()
        vars = {}
    })
    afterEach(async function () {
        await driver.quit()
    })
    it('TC22', async function () {
        await driver.get('http://127.0.0.1:5500/View/index.html')
        await driver.manage().window().setRect({ width: 974, height: 1080 })
        await driver
            .findElement(By.linkText('Edit/Delete Inspection Terms'))
            .click()
        await driver
            .findElement(By.css('li:nth-child(1) .edit_button > .trash_img'))
            .click()
        await driver.findElement(By.id('buttonCancel')).click()
        await driver.findElement(By.css('.save_popup_btn')).click()
    })
})
