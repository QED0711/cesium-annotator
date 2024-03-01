#!/bin/bash

npm run doc && npm run build && \
    cp package.json dist/ && \
    cp README.md dist/