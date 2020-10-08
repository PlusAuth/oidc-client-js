import {InMemoryStateStore, LocalStorageStateStore} from "../../src/helpers";

const store = new LocalStorageStateStore('test:')
const inMemory = new InMemoryStateStore()

describe('state manager', function () {
  describe('localStorage', function () {
    it('should set', function (done) {
      const obj = { a: 1}
      store.set('x', obj).then(()=>{
        expect(window.localStorage.getItem('test:x'))
          .toBe(JSON.stringify(obj))
        done()
      })
    });

    it('should get', function (done) {
      store.get('notExisted').then((val)=>{
        expect(val).toBeNull()
        done()
      })
    });
    it('should get (2)', function (done) {
      store.get('x').then((val)=>{
        const obj = { a: 1}
        expect(val).toStrictEqual(obj)
        done()
      })
    });

    it('should delete', function (done) {
      store.del('x').then(()=>{
        store.get('x').then(v => {
          expect(v).toBeNull()
          done()
        })
      })
    });

    it('should clear all', function (done) {
      const objects = Array(10).fill({x: 'x'})
      Promise.all(objects.map((obj, ind) => store.set(String(ind), obj)))
        .then(() => {
          store.clear().then(()=>{
            expect(window.localStorage.length).toBe(0)
            done()
          })
        })
    });

    it('should clear expired', function (done) {
      const objects = []
      window.localStorage.setItem('shouldNotDelete', '{ "a": "b"}')
      for (let i = 1; i <= 10; i++) {
        objects.push({ created_at: i * 1000 })
      }
      Promise.all(objects.map((obj, ind) => store.set(String(ind), obj)))
        .then(() => {
          store.clear(7000).then(()=>{
            expect(window.localStorage.length).toBe(5)
            for ( let i = 0; i < window.localStorage.length; i++ ){
              const key = window.localStorage.key( i )
              // @ts-ignore
              const storedObj = JSON.parse(window.localStorage.getItem(key))
              if(storedObj.created_at){
                expect(storedObj.created_at).toBeGreaterThanOrEqual(7000)
              }
            }
            done()
          })
        })
    });
  })

  describe('inMemory', function () {
    it('should set', function (done) {
      const obj = { a: 1}
      inMemory.set('x', obj).then(()=>{
        expect(inMemory.map.get('x'))
          .toBe(obj)
        done()
      })
    });

    it('should get', function (done) {
      inMemory.get('notExisted').then((val)=>{
        expect(val).toBeNull()
        done()
      })
    });
    it('should get (2)', function (done) {
      inMemory.get('x').then((val)=>{
        const obj = { a: 1}
        expect(val).toStrictEqual(obj)
        done()
      })
    });

    it('should delete', function (done) {
      inMemory.del('x').then(()=>{
        inMemory.get('x').then(v => {
          expect(v).toBeNull()
          done()
        })
      })
    });

    it('should clear all', function (done) {
      const objects = Array(10).fill({x: 'x'})
      Promise.all(objects.map((obj, ind) => inMemory.set(String(ind), obj)))
        .then(() => {
          inMemory.clear().then(()=>{
            expect(inMemory.map.size).toBe(0)
            done()
          })
        })
    });

    it('should clear expired', function (done) {
      const objects = []
      inMemory.map.set('shouldNotDelete', '{ "a": "b"}')
      for (let i = 1; i <= 10; i++) {
        objects.push({ created_at: i * 1000 })
      }
      Promise.all(objects.map((obj, ind) => inMemory.set(String(ind), obj)))
        .then(() => {
          inMemory.clear(7000).then(()=>{
            expect(inMemory.map.size).toBe(5)
            for (const key of inMemory.map.keys()) {
              const storedObj = inMemory.map.get(key)
              if(storedObj.created_at){
                expect(storedObj.created_at).toBeGreaterThanOrEqual(7000)
              }
            }
            done()
          })
        })
    });
  })
})
