const fs = require('fs');

const path = require('path');

const Recipe = require('../models/recipe');

const Chef = require('../models/chef');

const mongoose = require("mongoose");

exports.postRecipe = async(req, res, next)=>{
    // if (!req.file) {
    //     const error = new Error('No image provided');
    //     error.statusCode = 422;
    //     throw error;
    // }
    const title = req.body.title;
    const imageUrl = req.body.imageUrl;//req.file.path;
    const chef = req.body.chef;
    const duration = req.body.duration;
    const affordability = req.body.affordability;
    const complexity = req.body.complexity;
    const isVegetarian = req.body.isVegetarian;
    const ingredients = req.body.ingredients;
    const categories = req.body.categories;
    const steps = req.body.steps;
    const recipe = new Recipe({
        title: title,
        imageUrl: imageUrl,
        duration: duration,
        ingredients: ingredients,
        categories: categories,
        steps:steps,
        chef: chef,
        complexity: complexity,
        affordability: affordability,
        isVegetarian: isVegetarian
    });
    try{
        await recipe.save();
        res.status(201).json({
            message: 'Recipe created successfully',
            recipe: recipe,
            creator: {
                _id: recipe.chef
            },
        });
    }catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};