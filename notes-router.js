require('dotenv').config()
const path = require('path')
const express = require('express')
const NotesService = require('./notes-service')
const NotesRouter = express.Router()
const jsonParser = express.json()
const xss = require('xss')

const serializedNotes = note => ({
    id: note.id,
    title: xss(note.title),
    content: xss(note.content),
    date_published: note.date_published
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
        const {title, content} = req.body
        const newNote = {title, content}

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
            .json(serializedNotes(note))
        })
        .catch(next)
    })
NotesRouter
    .route('/api/notes/:note-id')
    .all((req, res, next) => {
        NotesService.getById(
            req.app.get('db'),
            req.params.notes_id
        )
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
        res.json(serializedNotes(res.user))
    })
    .delete((req, res, next) => {
        UsersService.deleteUser(
            req.app.get('db'),
            req.param.notes_id
        )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
    .patch(jsonParser, (req, res, next) => {
        const {title, content} = req.body
        const notetoUpdate = {title, content}
        const numberOfValues = Object.values(notetoUpdate).filter(Boolean).length
        if(numberOfValues === 0){
            return res.status(400).json({
                error: {
                    message: `Request body must contain either a title or content change`
                }
            })
         }
        
    NotesService.updateNote(
        req.app.get('db'),
        req.params.notes_id,
        notetoUpdate
    )
        .then(numRowsAffected => {
            res.status(204).end()
        })
        .catch(next)
    })
module.exports = NotesRouter