"use client"

import React, { useState } from 'react'

const page = () => {
  const [title, settitle] = useState('')
  const [desc, setdesc] = useState('')
  const [mainTask, setmainTask] = useState([])

  function submitHandler(e) {
    e.preventDefault()
    setmainTask([...mainTask, { title, desc }])
    setdesc('')
    settitle('')
    console.log(mainTask)
  }

  const deleteHandler = (i) => {
    let copyTask = [...mainTask]
    copyTask.splice(i, 1)
    setmainTask(copyTask)
  }

  let rendertask = <h2 className='text-gray-500 text-center py-10 italic'>No task available</h2>
  if (mainTask.length > 0) {
    rendertask = mainTask.map((t, i) => (
      <li key={i} className="mb-4 border-b border-gray-300 pb-3">
        <div className='flex justify-between items-center'>
          <h2 className='font-semibold text-lg text-gray-800'>{t.title}</h2>
          <p className='text-gray-600 flex-grow mx-6'>{t.desc}</p>
          <button
            onClick={() => deleteHandler(i)}
            className='bg-amber-700 hover:bg-amber-800 transition text-white py-1 px-3 rounded font-semibold'
          >
            Delete
          </button>
        </div>
      </li>
    ))
  }

  return (
    <>
      <div className="flex flex-col items-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 shadow-lg">
        {/* Logo Image */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
          alt="Logo"
          className="w-16 h-16 mb-2"
        />
        <h1 className='text-4xl font-serif font-bold text-amber-400 tracking-wide'>TO-DO LIST</h1>
      </div>

      <form onSubmit={submitHandler} className="max-w-3xl mx-auto my-8 flex flex-col gap-5 px-4">
        <input
          className='border border-gray-400 rounded px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm'
          placeholder='Enter title here'
          value={title}
          onChange={(e) => settitle(e.target.value)}
          required
        />
        <input
          className='border border-gray-400 rounded px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm'
          placeholder='Enter description here'
          value={desc}
          onChange={(e) => setdesc(e.target.value)}
          required
        />
        <button
          type="submit"
          className='bg-amber-600 hover:bg-amber-700 transition text-white py-3 rounded font-semibold shadow-md'
        >
          Add Task
        </button>
      </form>

      <div className='max-w-3xl mx-auto bg-gray-900 text-amber-400 px-6 py-3 rounded-t-md flex justify-between font-semibold text-lg tracking-wide shadow'>
        <div className='w-1/4'>TITLE</div>
        <div className='w-3/4'>DESCRIPTION</div>
      </div>

      <div className='max-w-3xl mx-auto bg-white p-6 rounded-b-md shadow'>
        <ul>{rendertask}</ul>
      </div>
    </>
  )
}

export default page
