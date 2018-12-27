Array.prototype.unique = () => {
  return this.filter((value, index, self) => {
    return self.indexOf(value) === index;
  });
}
