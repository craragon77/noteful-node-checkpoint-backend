require('dotenv').config()
const path = require('path')
const express = require('express')
const NotesService = require('./notes-service')
const NotesRouter = express.Router()
const jsonParser = express.json()
const bodyParser = express.json()
const xss = require('xss')

const serializedNotes = note => ({
    id: note.id,
    title: xss(note.title),
    content: xss(note.content),
    folder_id: note.folder_id,
    date: note.date
})
NotesRouter
    .route('/api/notes')
    .get((req,res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
            .then(notes => {
                res.json(notes.map(serializedNotes))
            })
            .catch(next)
    })
    .post(jsonParser, (req,res,next) => {
        const {title, content, folder_id} = req.body
        const newNote = {title, content, folder_id}

        for(const[key, value] of Object.entries(newNote)){
            if(![value]){
                return res.status(404).json({
                    error: {message: `missing ${key} in request body`}
                })
            }
        }
    

    //if (!title || !content){
      //  logger.error(`User must list both a title and content to sucessfully submit`)
        //return res.status(400).send({
          //  error: {message: `User must list both a title and content to the note`}
        //})
    //}

    NotesService.insertNote(
        req.app.get('db'),
        newNote
    )
        .then(note => {
            res.status(201)
            .location(path.posix.join(req.originalUrl, `/${note.id}`))
            .json(serializedNotes(note.id))
        })
        .catch(next)
    })
NotesRouter
    .route(`/api/notes/:id`)
    .all(jsonParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        console.log(req.body)
        const {id} = req.body
        const note_id = {id}
        NotesService.getById(knexInstance, note_id)
        .then(note => {
            if (!note){
                return res.status(404).json({
                    error: {message: `uh-oh, no note was found under that id!`}
                })
            }
            res.note = note
            next()
        })
        .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializedNotes(res.note))
    })
    .delete(jsonParser,(req, res, next) => {
        const knexInstance = req.app.get('db')
        console.log(req.param)
        const {id} = req.params
        const note_id = {id}
        NotesService.deleteNote(knexInstance,note_id)
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(bodyParser, (req, res, next) => {
        const knexInstance = req.app.get('db')
        const {id, title, content, folder_id} = req.body
        const notetoUpdate = {title, content, folder_id}
        const note_id = {id}
        const numberOfValues = Object.values(notetoUpdate).filter(Boolean).length
        if(numberOfValues === 0){
            return res.status(400).json({
                error: {
                    message: `Request body must contain either a title or content change`
                }
            })
         }
        
    NotesService.updateNote(knexInstance, note_id, notetoUpdate)
        .then(() => {
            res.status(204).end()
        })
        .catch(next)
    })
module.exports = NotesRouter