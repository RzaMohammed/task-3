.PHONY: install dev build test clean lint

install:
	npm install

dev:
	npm run dev

build:
	npm run build

test:
	npm test

clean:
	rm -rf node_modules dist build coverage

lint:
	npm run lint

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down
