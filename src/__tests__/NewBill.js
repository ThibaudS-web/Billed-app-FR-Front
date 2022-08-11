/**
 * @jest-environment jsdom
 */
import { fireEvent, createEvent, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js"
import store from "../__mocks__/store.js";





describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then all fields are display", () => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const expenseType = screen.getByTestId('expense-type')
      const expenseName = screen.getByTestId('expense-name')
      const datePicker = screen.getByTestId('datepicker')
      const amount = screen.getByTestId('amount')
      const vat = screen.getByTestId('vat')
      const pct = screen.getByTestId('pct')
      const commentary = screen.getByTestId('commentary')
      const file = screen.getByTestId('file')

      const FIELDS = [expenseType, expenseName, datePicker, amount, vat, pct, commentary, file]

      const inputsAreDisplayed = FIELDS.every(field => field)
      expect(inputsAreDisplayed).toBeTruthy()
    })

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      let isHighlightedIcon = mailIcon.getAttribute('class')
      expect(isHighlightedIcon).toBe('active-icon')
    })
  })
})

describe("Given I am connected as an employee and I am on NewBill Page", () => {
  const user = {
    type: 'Employee',
    email: 'employee@employee'
  }

  const onNavigate = (pathname) => (document.body.innerHTML = ROUTES({ pathname }))

  beforeEach(() => {
    document.body.innerHTML = NewBillUI()
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify(user))
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe("When I do not fill fields and I click on button send", () => {
    test("Then I should stay on NewBill page", () => {
      const newBillcontainer = new NewBill({ document, onNavigate, store, localStorage })
      const handleSubmit = jest.fn(newBillcontainer.handleSubmit)
      const buttonNewBill = document.getElementById("btn-send-bill")
      buttonNewBill.addEventListener("click", (e) => handleSubmit)
      fireEvent.click(buttonNewBill)
      expect(window.location.href).toContain('#employee/bill/new')
    })
  })

  describe("When I use file with bad extension", () => {
    test("Then handleChangeFile function will return 0", () => {
      const inputFile = screen.getByTestId("file")
      const container = new NewBill({ document, onNavigate, store, localStorage })
      const handleChangeFile = jest.fn(container.handleChangeFile)
      inputFile.addEventListener("change", handleChangeFile)

      const event = {
        preventDefault() { },
        target: { value: 'device.svg' }
      }
      expect(handleChangeFile(event)).toBe(0)
    })
  })

  describe("When I use file with good extension", () => {
    test("Then handleChangeFile function should not return 0", () => {
      const inputFile = screen.getByTestId("file")
      const container = new NewBill({ document, onNavigate, store, localStorage })
      const handleChangeFile = jest.fn(container.handleChangeFile)
      inputFile.addEventListener("change", handleChangeFile)

      const event = {
        preventDefault() { },
        target: { value: 'device.png' }
      }
      expect(handleChangeFile(event)).not.toBe(0)
    })
  })


  describe("When I fill inputs with good format except for input file", () => {
    test("Then I should stay on NewBill Page", () => {
      const container = new NewBill({ document, onNavigate, store, localStorage })
      const handleSubmit = jest.fn(container.handleSubmit)
      const buttonNewBill = document.getElementById("btn-send-bill")
      const mock = jest.fn()
        .mockReturnValueOnce("04/07/2022")
        .mockReturnValueOnce(30)
        .mockReturnValueOnce(20)
        .mockReturnValueOnce("")

      const inputDate = screen.getByTestId("datepicker").value = mock()
      const inputAmount = screen.getByTestId("amount").value = mock()
      const inputPCT = screen.getByTestId("pct").value = mock()
      const inputFile = screen.getByTestId("file").file = mock()

      expect(inputDate).not.toBeNull()
      expect(inputAmount).not.toBeNull()
      expect(inputPCT).not.toBeNull()
      expect(inputFile).not.toBeNull()

      buttonNewBill.addEventListener("click", (e) => handleSubmit)
      fireEvent.click(buttonNewBill)
      expect(window.location.href).toContain('#employee/bill/new')
    })
  })

  //POST integration
  describe("When I fill all fields with good format and i submit", () => {
    test("Then it should called updateBill function", async () => {
      const newBillcontainer = new NewBill({ document, onNavigate, store, localStorage })

      const mockBill = {
        type: "Restaurants et bars",
        name: "Repas après réunion",
        date: "2022-04-07",
        amount: 240,
        vat: 70,
        pct: 20,
        commentary: "Repas après la réunion du 4 juillet",
        fileUrl: "https://localhost:4100/images/device.jpg",
        fileName: "device.jpg",
        status: "pending"
      }

      screen.getByTestId("expense-type").value = mockBill.type
      screen.getByTestId("expense-name").value = mockBill.name
      screen.getByTestId("datepicker").value = mockBill.date
      screen.getByTestId("amount").value = mockBill.amount
      screen.getByTestId("vat").value = mockBill.vat
      screen.getByTestId("pct").value = mockBill.pct
      screen.getByTestId("commentary").value = mockBill.commentary

      newBillcontainer.fileName = mockBill.fileName
      newBillcontainer.fileUrl = mockBill.fileUrl

      newBillcontainer.updateBill = jest.fn()
      const handleSubmit = jest.fn(newBillcontainer.handleSubmit)

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      fireEvent.submit(form)

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBillcontainer.updateBill).toHaveBeenCalled()
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
    })
  })
})

