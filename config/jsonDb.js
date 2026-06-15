const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to read/write JSON files
const readJson = (filename) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error reading ${filename}.json:`, error);
    return [];
  }
};

const writeJson = (filename, data) => {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Generates a simple MongoDB-like ObjectId string
const generateId = () => {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16).padStart(8, '0');
  const random = Math.random().toString(16).substring(2, 18).padStart(16, '0');
  return timestamp + random;
};

// Strip internal metadata fields before writing to JSON
const stripMeta = (doc) => {
  const clean = { ...doc };
  delete clean._modelName;
  delete clean._filename;
  return clean;
};

// Mock Query Class to support chaining like Mongoose (.sort, .populate, etc.)
class MockQuery {
  constructor(data, modelName, isSingle = false) {
    this.data = data;
    this.modelName = modelName;
    this.isSingle = isSingle;
    this.populatePaths = [];
    this.sortCriteria = null;
  }

  populate(pathOption, fields) {
    this.populatePaths.push(pathOption);
    return this;
  }

  sort(criteria) {
    this.sortCriteria = criteria;
    return this;
  }

  // Execute sorting and population, then return result
  exec() {
    let result = this.isSingle ? this.data : [...this.data];

    // Apply Sorting
    if (this.sortCriteria && !this.isSingle) {
      const field = Object.keys(this.sortCriteria)[0];
      const order = this.sortCriteria[field]; // 1 or -1
      result.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (!valA && !valB) return 0;
        if (!valA) return 1;
        if (!valB) return -1;
        if (typeof valA === 'string') {
          return order === 1 ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return order === 1 ? valA - valB : valB - valA;
      });
    }

    // Apply Population
    if (this.populatePaths.length > 0) {
      const allCustomers = readJson('customers');
      const allMeasurements = readJson('measurements');

      const populateDoc = (doc) => {
        if (!doc) return doc;
        const newDoc = { ...doc };

        this.populatePaths.forEach((pathOpt) => {
          let pathStr = typeof pathOpt === 'string' ? pathOpt : pathOpt.path;

          // Simple populate for 'customer'
          if (pathStr === 'customer') {
            if (newDoc.customer && typeof newDoc.customer === 'string') {
              const matched = allCustomers.find(c => c._id === newDoc.customer);
              if (matched) newDoc.customer = matched;
            }
          }

          // Populate nested items.measurementUsed
          if (pathStr === 'items.measurementUsed') {
            if (newDoc.items && Array.isArray(newDoc.items)) {
              newDoc.items = newDoc.items.map(item => {
                const newItem = { ...item };
                if (newItem.measurementUsed && typeof newItem.measurementUsed === 'string') {
                  const matched = allMeasurements.find(m => m._id === newItem.measurementUsed);
                  if (matched) newItem.measurementUsed = matched;
                }
                return newItem;
              });
            }
          }

          // Simple populate for measurementUsed in other context
          if (pathStr === 'measurementUsed') {
            if (newDoc.measurementUsed && typeof newDoc.measurementUsed === 'string') {
              const matched = allMeasurements.find(m => m._id === newDoc.measurementUsed);
              if (matched) newDoc.measurementUsed = matched;
            }
          }
        });

        return newDoc;
      };

      if (this.isSingle) {
        result = populateDoc(result);
      } else {
        result = result.map(doc => populateDoc(doc));
      }
    }

    return result;
  }

  // To support thenable/async await directly on query
  then(onFulfilled, onRejected) {
    try {
      const res = this.exec();
      return Promise.resolve(res).then(onFulfilled, onRejected);
    } catch (err) {
      return Promise.reject(err).catch(onRejected);
    }
  }
}

// JSON Database Model Emulator
class JsonModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filename = modelName.toLowerCase() + 's';
  }

  find(query = {}) {
    const list = readJson(this.filename);
    let filtered = list;

    if (Object.keys(query).length > 0) {
      filtered = list.filter(item => {
        return Object.entries(query).every(([key, val]) => {
          if (item[key] === undefined) return false;
          return String(item[key]) === String(val);
        });
      });
    }

    return new MockQuery(filtered, this.modelName);
  }

  findById(id) {
    const list = readJson(this.filename);
    const found = list.find(item => item._id === String(id));
    return new MockQuery(found || null, this.modelName, true);
  }

  async create(data) {
    const list = readJson(this.filename);
    const now = new Date().toISOString();
    const doc = {
      _id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now
    };

    // Simulate order number pre-save hook for orders
    if (this.modelName === 'Order') {
      const count = list.length;
      doc.orderNumber = `ORD-${String(count + 1001).padStart(4, '0')}`;
      
      doc.totalAmount = parseFloat(doc.totalAmount) || 0;
      doc.advanceAmount = parseFloat(doc.advanceAmount) || 0;
      doc.balanceAmount = doc.totalAmount - doc.advanceAmount;
      
      if (doc.balanceAmount <= 0) {
        doc.paymentStatus = 'Fully Paid';
      } else if (doc.advanceAmount > 0) {
        doc.paymentStatus = 'Partially Paid';
      } else {
        doc.paymentStatus = 'Unpaid';
      }
      doc.status = doc.status || 'Pending';
      doc.orderDate = doc.orderDate || now;
      doc.paymentMethod = doc.paymentMethod || 'Cash';
    }

    list.push(doc);
    writeJson(this.filename, list);
    return doc;
  }

  async countDocuments(query = {}) {
    const list = readJson(this.filename);
    if (Object.keys(query).length === 0) return list.length;
    return list.filter(item => {
      return Object.entries(query).every(([key, val]) => item[key] === val);
    }).length;
  }

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      writeJson(this.filename, []);
      return { deletedCount: 0 };
    }
    const list = readJson(this.filename);
    const remaining = list.filter(item => {
      return !Object.entries(query).every(([key, val]) => String(item[key]) === String(val));
    });
    writeJson(this.filename, remaining);
    return { deletedCount: list.length - remaining.length };
  }
}

// Instance representing a single loaded doc with .save() and .deleteOne()
class JsonDocumentInstance {
  constructor(modelName, doc) {
    this._modelName = modelName;
    this._filename = modelName.toLowerCase() + 's';
    Object.assign(this, doc);
  }

  async save() {
    const list = readJson(this._filename);
    this.updatedAt = new Date().toISOString();

    // Recalculate fields if it is an Order
    if (this._modelName === 'Order') {
      this.totalAmount = parseFloat(this.totalAmount) || 0;
      this.advanceAmount = parseFloat(this.advanceAmount) || 0;
      this.balanceAmount = this.totalAmount - this.advanceAmount;

      if (this.balanceAmount <= 0) {
        this.paymentStatus = 'Fully Paid';
      } else if (this.advanceAmount > 0) {
        this.paymentStatus = 'Partially Paid';
      } else {
        this.paymentStatus = 'Unpaid';
      }

      if (!this.orderNumber) {
        const count = list.length;
        this.orderNumber = `ORD-${String(count + 1001).padStart(4, '0')}`;
      }
      if (!this.orderDate) {
        this.orderDate = new Date().toISOString();
      }
    }

    const cleanDoc = stripMeta(this);
    const index = list.findIndex(item => item._id === this._id);

    if (index !== -1) {
      list[index] = cleanDoc;
    } else {
      if (!cleanDoc._id) cleanDoc._id = generateId();
      list.push(cleanDoc);
    }

    writeJson(this._filename, list);
    return this;
  }

  async deleteOne() {
    const list = readJson(this._filename);
    const filtered = list.filter(item => item._id !== this._id);
    writeJson(this._filename, filtered);
    return this;
  }
}

// Overwrite findById to return document instance with save/delete methods
const getModelEmulator = (modelName) => {
  const model = new JsonModel(modelName);
  
  // Wrap standard methods to convert regular objects into JsonDocumentInstances
  const originalFindById = model.findById;
  model.findById = function(id) {
    const query = originalFindById.call(model, id);
    const originalThen = query.then;
    query.then = function(onFulfilled, onRejected) {
      return originalThen.call(query, (res) => {
        if (res) {
          const docInst = new JsonDocumentInstance(modelName, res);
          return onFulfilled(docInst);
        }
        return onFulfilled(null);
      }, onRejected);
    };
    return query;
  };

  // Wrap create to return document instances
  const originalCreate = model.create.bind(model);
  model.create = async function(data) {
    const doc = await originalCreate(data);
    return new JsonDocumentInstance(modelName, doc);
  };

  // Wrap save method on new instances
  model.construct = function(data) {
    return new JsonDocumentInstance(modelName, data);
  };

  return model;
};

module.exports = {
  Customer: getModelEmulator('Customer'),
  Measurement: getModelEmulator('Measurement'),
  Order: getModelEmulator('Order'),
  User: getModelEmulator('User'),
  Sample: getModelEmulator('Sample')
};
